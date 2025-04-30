"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";

interface Tip {
  question: string;
  answer: string;
}

const englishTips: Tip[] = [
  {
    question: "How to make perfect hard-boiled eggs?",
    answer:
      "Put eggs in cold water, bring to boil, turn off heat, wait 12 minutes, then put in cold water. They'll peel easily and be perfectly cooked.",
  },
  {
    question: "How to keep bananas fresh longer?",
    answer:
      "Wrap the stem end of each banana in plastic wrap. This simple trick keeps them fresh for days longer.",
  },
  {
    question: "How to clean a microwave easily?",
    answer:
      "Put a bowl of water with lemon slices in the microwave for 5 minutes. The steam makes everything wipe off easily.",
  },
  {
    question: "How to make boxed cake mix taste better?",
    answer:
      "Add an extra egg, use milk instead of water, and use melted butter instead of oil. Simple changes, big difference!",
  },
  {
    question: "How to cook bacon without the mess?",
    answer:
      "Put bacon on a baking sheet with foil, bake at 200°C for 20 minutes. No splatter, perfect crisp!",
  },
  {
    question: "How to keep cookies soft?",
    answer:
      "Put a slice of bread in the cookie container. The cookies stay soft and you can eat the bread when done!",
  },
  {
    question: "How to peel garlic easily?",
    answer:
      "Put a clove under the flat side of a wide knife, press down gently, and the skin comes right off.",
  },
  {
    question: "How to make boxed mac and cheese better?",
    answer:
      "Add extra cheese, a splash of milk, and a bit of butter. Maybe some bacon bits if you have them!",
  },
  {
    question: "How to cook rice perfectly?",
    answer:
      "Put your finger on top of the rice - add water until it reaches your first finger joint. Cook covered until done.",
  },
  {
    question: "How to make perfect grilled cheese?",
    answer:
      "Butter the bread, not the pan. Cook low and slow with a lid on. The cheese melts perfectly!",
  },
  {
    question: "How to clean a blender easily?",
    answer:
      "Fill halfway with warm water and a drop of soap, blend for 30 seconds, rinse. Done!",
  },
  {
    question: "How to make boxed brownies fudgier?",
    answer:
      "Add an extra egg yolk and use melted butter instead of oil. Bake a bit less than the package says.",
  },
  {
    question: "How to keep brown sugar soft?",
    answer:
      "Put a marshmallow in the container. The sugar stays soft and you get a treat when it's done!",
  },
  {
    question: "How to make perfect microwave popcorn?",
    answer:
      "Put kernels in a paper lunch bag, fold the top twice, microwave until popping slows down.",
  },
  {
    question: "How to measure pasta portions easily?",
    answer:
      "Use a coffee mug - one mug of dry pasta is perfect for one person.",
  },
  {
    question: "How to make boxed mashed potatoes better?",
    answer:
      "Add cream cheese, butter, and garlic powder. Top with chives if you have them!",
  },
  {
    question: "How to keep lettuce fresh longer?",
    answer:
      "Wash and dry well, wrap in paper towels, put in a plastic bag. Replace wet towels as needed.",
  },
  {
    question: "How to clean a burnt pan easily?",
    answer:
      "Cover with baking soda, add vinegar until it fizzes, add hot water, let sit overnight. Wipes clean in the morning!",
  },
  {
    question: "How to keep herbs fresh?",
    answer:
      "Put stems in a glass of water like flowers, cover leaves with a plastic bag, keep in fridge.",
  },
  {
    question: "How to make perfect scrambled eggs?",
    answer:
      "Cook low and slow, stir constantly with a spatula. Take off heat when still slightly wet - they'll finish cooking.",
  },
];

const spanishTips: Tip[] = [
  {
    question: "¿Cómo hacer huevos duros perfectos?",
    answer:
      "Pon los huevos en agua fría, lleva a ebullición, apaga el fuego, espera 12 minutos y luego ponlos en agua fría. Se pelarán fácilmente y estarán perfectamente cocidos.",
  },
  {
    question: "¿Cómo mantener los plátanos frescos por más tiempo?",
    answer:
      "Envuelve el extremo del tallo de cada plátano con papel film. Este simple truco los mantiene frescos durante días.",
  },
  {
    question: "¿Cómo limpiar un microondas fácilmente?",
    answer:
      "Coloca un bol de agua con rodajas de limón en el microondas durante 5 minutos. El vapor hace que todo se limpie fácilmente.",
  },
  {
    question: "¿Cómo mejorar el sabor de una mezcla de pastel preparada?",
    answer:
      "Añade un huevo extra, usa leche en lugar de agua y mantequilla derretida en lugar de aceite. Cambios simples, ¡gran diferencia!",
  },
  {
    question: "¿Cómo cocinar bacon sin ensuciar?",
    answer:
      "Coloca el bacon en una bandeja con papel de aluminio, hornea a 200°C durante 20 minutos. ¡Sin salpicaduras, perfectamente crujiente!",
  },
  {
    question: "¿Cómo mantener las galletas blandas?",
    answer:
      "Coloca una rebanada de pan en el recipiente de las galletas. Las galletas se mantienen blandas y ¡puedes comerte el pan cuando termines!",
  },
  {
    question: "¿Cómo pelar ajo fácilmente?",
    answer:
      "Coloca un diente bajo el lado plano de un cuchillo ancho, presiona suavemente y la piel se desprenderá fácilmente.",
  },
  {
    question: "¿Cómo mejorar la pasta con queso de caja?",
    answer:
      "Añade queso extra, un chorrito de leche y un poco de mantequilla. ¡Tal vez un poco de bacon si tienes!",
  },
  {
    question: "¿Cómo cocinar arroz perfectamente?",
    answer:
      "Pon tu dedo sobre el arroz - añade agua hasta que llegue a la primera articulación del dedo. Cocina tapado hasta que esté listo.",
  },
  {
    question: "¿Cómo hacer un sándwich de queso a la plancha perfecto?",
    answer:
      "Unta el pan con mantequilla, no la sartén. Cocina a fuego lento con una tapa. ¡El queso se derrite perfectamente!",
  },
  {
    question: "¿Cómo limpiar una licuadora fácilmente?",
    answer:
      "Llena hasta la mitad con agua tibia y una gota de jabón, licúa durante 30 segundos, enjuaga. ¡Listo!",
  },
  {
    question: "¿Cómo hacer que los brownies de caja queden más húmedos?",
    answer:
      "Añade una yema de huevo extra y usa mantequilla derretida en lugar de aceite. Hornea un poco menos de lo que indica el paquete.",
  },
  {
    question: "¿Cómo mantener el azúcar moreno blando?",
    answer:
      "Pon un malvavisco en el recipiente. El azúcar se mantiene blando y ¡obtienes un premio cuando termines!",
  },
  {
    question: "¿Cómo hacer palomitas en microondas perfectas?",
    answer:
      "Pon los granos en una bolsa de papel, dobla la parte superior dos veces, calienta en el microondas hasta que disminuyan los estallidos.",
  },
  {
    question: "¿Cómo medir porciones de pasta fácilmente?",
    answer:
      "Usa una taza de café - una taza de pasta seca es perfecta para una persona.",
  },
  {
    question: "¿Cómo mejorar el puré de patatas instantáneo?",
    answer:
      "Añade queso crema, mantequilla y ajo en polvo. ¡Cubre con cebollino si tienes!",
  },
  {
    question: "¿Cómo mantener la lechuga fresca por más tiempo?",
    answer:
      "Lava y seca bien, envuelve en papel de cocina, coloca en una bolsa de plástico. Reemplaza las toallas húmedas según sea necesario.",
  },
  {
    question: "¿Cómo limpiar una sartén quemada fácilmente?",
    answer:
      "Cubre con bicarbonato de sodio, añade vinagre hasta que burbujee, añade agua caliente, deja reposar toda la noche. ¡Se limpia fácilmente por la mañana!",
  },
  {
    question: "¿Cómo mantener las hierbas frescas?",
    answer:
      "Coloca los tallos en un vaso con agua como flores, cubre las hojas con una bolsa de plástico, guarda en el refrigerador.",
  },
  {
    question: "¿Cómo hacer huevos revueltos perfectos?",
    answer:
      "Cocina a fuego lento, revuelve constantemente con una espátula. Retira del fuego cuando aún estén ligeramente húmedos - terminarán de cocinarse solos.",
  },
];

export default function TipsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t, language } = useLanguage();

  const toggleTip = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const tips = language === "es" ? spanishTips : englishTips;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">{t("tips.title")}</h1>
      <div className="max-w-3xl mx-auto space-y-4">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="border rounded-lg overflow-hidden bg-white shadow-sm"
          >
            <button
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
              onClick={() => toggleTip(index)}
            >
              <span className="font-semibold">{tip.question}</span>
              {openIndex === index ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 bg-gray-50">
                <p className="text-gray-700">{tip.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
