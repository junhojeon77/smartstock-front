import { Topbar } from "@/components/layout/Topbar";
import { SmartSourcing } from "@/components/sourcing/SmartSourcing";

export default function SourcingPage() {
  return (
    <>
      <Topbar title="Smart Sourcing" />
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <SmartSourcing />
      </div>
    </>
  );
}
