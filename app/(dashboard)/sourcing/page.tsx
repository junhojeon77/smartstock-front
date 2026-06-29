import { PriceComparison } from "@/components/sourcing/PriceComparison";

export default function SourcingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Smart Sourcing</h1>
        <p className="text-gray-600">Compare vendor prices and optimize procurement.</p>
      </div>
      <PriceComparison />
    </div>
  );
}
