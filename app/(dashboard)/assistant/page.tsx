import { ForecastWidget } from "@/components/forecast/ForecastWidget";
import { Chatbot } from "@/components/chat/Chatbot";

export default function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">AI Assistant</h1>
        <p className="text-slate-500">
          Demand forecasts and procurement help, powered by your inventory data.
        </p>
      </div>

      <ForecastWidget />
      <Chatbot />
    </div>
  );
}
