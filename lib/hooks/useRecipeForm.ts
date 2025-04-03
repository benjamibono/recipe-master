import { useReducer, useCallback } from "react";
import { Ingredient } from "@/components/recipe/RecipeFormIngredients";
import { RecipeAudioData } from "@/lib/audio-text";
import { toast } from "sonner";

export interface RecipeFormState {
  name: string;
  time: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  image_url?: string;
  isValid: boolean;
}

type RecipeFormAction =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_TIME"; payload: number }
  | { type: "SET_SERVINGS"; payload: number }
  | { type: "ADD_INGREDIENT"; payload: Ingredient }
  | { type: "REMOVE_INGREDIENT"; payload: number }
  | { type: "ADD_INSTRUCTION"; payload: string }
  | { type: "REMOVE_INSTRUCTION"; payload: number }
  | { type: "SET_IMAGE"; payload: string | undefined }
  | { type: "MERGE_RECIPE"; payload: Partial<RecipeFormState> }
  | { type: "MERGE_AUDIO_DATA"; payload: RecipeAudioData }
  | { type: "RESET" };

function validateForm(state: Omit<RecipeFormState, "isValid">): boolean {
  return Boolean(state.name.trim() && state.ingredients.length > 0);
}

function recipeFormReducer(
  state: RecipeFormState,
  action: RecipeFormAction
): RecipeFormState {
  let newState: Omit<RecipeFormState, "isValid">;

  switch (action.type) {
    case "SET_NAME":
      newState = { ...state, name: action.payload };
      break;
    case "SET_TIME":
      newState = { ...state, time: action.payload };
      break;
    case "SET_SERVINGS":
      newState = { ...state, servings: action.payload };
      break;
    case "ADD_INGREDIENT":
      newState = {
        ...state,
        ingredients: [...state.ingredients, action.payload],
      };
      break;
    case "REMOVE_INGREDIENT":
      newState = {
        ...state,
        ingredients: state.ingredients.filter((_, i) => i !== action.payload),
      };
      break;
    case "ADD_INSTRUCTION":
      newState = {
        ...state,
        instructions: [...state.instructions, action.payload],
      };
      break;
    case "REMOVE_INSTRUCTION":
      newState = {
        ...state,
        instructions: state.instructions.filter((_, i) => i !== action.payload),
      };
      break;
    case "SET_IMAGE":
      newState = { ...state, image_url: action.payload };
      break;
    case "MERGE_RECIPE":
      newState = { ...state, ...action.payload };
      break;
    case "MERGE_AUDIO_DATA":
      const audioData = action.payload;
      newState = {
        ...state,
        // Only update name if it exists and current name is empty
        name: audioData.name && !state.name ? audioData.name : state.name,
        // Only update time if it exists and is a valid number
        time:
          audioData.time && audioData.time > 0 ? audioData.time : state.time,
        // Only update servings if it exists and is a valid number
        servings:
          audioData.servings && audioData.servings > 0
            ? audioData.servings
            : state.servings,
        // Add new ingredients to existing ones
        ingredients: [
          ...state.ingredients,
          ...(audioData.ingredients || [])
            .filter(
              (ing) =>
                // Only add ingredients that don't already exist
                !state.ingredients.some(
                  (existing) =>
                    existing.name.toLowerCase() === ing.name.toLowerCase()
                )
            )
            .map((ing) => ({
              name: ing.name,
              amount: ing.amount,
              unit: (ing.unit === "g" || ing.unit === "ml" || ing.unit === "u"
                ? ing.unit
                : "u") as "g" | "ml" | "u",
            })),
        ],
        // Add new instructions to existing ones
        instructions: [
          ...state.instructions,
          ...(audioData.instructions || []).filter(
            (instruction) =>
              // Only add instructions that don't already exist
              !state.instructions.some(
                (existing) =>
                  existing.toLowerCase() === instruction.toLowerCase()
              )
          ),
        ],
      };
      break;
    case "RESET":
      return getInitialState();
    default:
      return state;
  }

  return {
    ...newState,
    isValid: validateForm(newState),
  };
}

function getInitialState(): RecipeFormState {
  return {
    name: "",
    time: 0,
    servings: 1,
    ingredients: [],
    instructions: [],
    isValid: false,
  };
}

export function useRecipeForm() {
  const [state, dispatch] = useReducer(recipeFormReducer, getInitialState());

  const setName = useCallback((name: string) => {
    dispatch({ type: "SET_NAME", payload: name });
  }, []);

  const setTime = useCallback((time: number) => {
    dispatch({ type: "SET_TIME", payload: time });
  }, []);

  const setServings = useCallback((servings: number) => {
    dispatch({ type: "SET_SERVINGS", payload: Math.max(1, servings) });
  }, []);

  const addIngredient = useCallback((ingredient: Ingredient) => {
    if (!ingredient.name || ingredient.amount <= 0) {
      toast.error("Ingredient must have a name and amount greater than 0");
      return;
    }
    dispatch({ type: "ADD_INGREDIENT", payload: ingredient });
  }, []);

  const removeIngredient = useCallback((index: number) => {
    dispatch({ type: "REMOVE_INGREDIENT", payload: index });
  }, []);

  const addInstruction = useCallback((instruction: string) => {
    if (!instruction.trim()) {
      toast.error("Instruction cannot be empty");
      return;
    }
    dispatch({ type: "ADD_INSTRUCTION", payload: instruction });
  }, []);

  const removeInstruction = useCallback((index: number) => {
    dispatch({ type: "REMOVE_INSTRUCTION", payload: index });
  }, []);

  const setImage = useCallback((url: string | undefined) => {
    dispatch({ type: "SET_IMAGE", payload: url });
  }, []);

  const mergeRecipe = useCallback((recipeData: Partial<RecipeFormState>) => {
    dispatch({ type: "MERGE_RECIPE", payload: recipeData });
  }, []);

  const mergeAudioData = useCallback((audioData: RecipeAudioData) => {
    dispatch({ type: "MERGE_AUDIO_DATA", payload: audioData });
    toast.success("Recipe information updated from audio");
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    setName,
    setTime,
    setServings,
    addIngredient,
    removeIngredient,
    addInstruction,
    removeInstruction,
    setImage,
    mergeRecipe,
    mergeAudioData,
    reset,
  };
}
