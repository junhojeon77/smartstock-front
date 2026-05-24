import { Topbar } from "@/components/layout/Topbar";
import { InventoryClient } from "./InventoryClient";

export default function InventoryPage() {
  return (
    <>
      <Topbar title="Inventory Overview" />
      <InventoryClient />
    </>
  );
}
