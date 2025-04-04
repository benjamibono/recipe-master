"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Tip {
  question: string;
  answer: string;
}

const tips: Tip[] = [
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

export default function TipsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleTip = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Tips & Tricks</h1>
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
