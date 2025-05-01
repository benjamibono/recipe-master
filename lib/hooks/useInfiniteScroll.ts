import { useEffect, useRef, useState } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export function useInfiniteScroll(
  onLoadMore: () => void,
  {
    threshold = 0.1,
    rootMargin = "50px",
    enabled = true,
  }: UseInfiniteScrollOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Limpiar el observador anterior si existe
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Si no está habilitado, no crear el observador
    if (!enabled) {
      return;
    }

    // Crear un nuevo observador
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);

        // Llamar a onLoadMore solo cuando el elemento entra en vista
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Observar el elemento si existe
    const currentTarget = targetRef.current;
    if (currentTarget) {
      observerRef.current.observe(currentTarget);
    }

    // Limpiar al desmontar
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, threshold, rootMargin, enabled]);

  // Función para actualizar la referencia del elemento
  const setTarget = (element: HTMLDivElement | null) => {
    targetRef.current = element;

    if (element && observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current.observe(element);
    }
  };

  return {
    ref: setTarget,
    isIntersecting,
  };
}
