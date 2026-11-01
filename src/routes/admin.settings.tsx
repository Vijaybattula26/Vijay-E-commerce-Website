import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminTitle, Card } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/store/ConfirmButton";
import { btnPrimary, inputCls } from "@/components/store/SiteLayout";
import { adminAuth, categoriesDb, ordersDb, productsDb, settingsDb, useSettings } from "@/lib/db";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const s = useSettings();
  const navigate = useNavigate();
  return (
    <>
      <AdminTitle title="Settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-display text-xl">Delivery charges</h2>
          <form
            key={JSON.stringify(s)}
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const n = (k: string) => Number(fd.get(k));
              const next = {
                freeDeliveryThreshold: n("free"),
                standardFee: n("std"),
                expressFee: n("exp"),
              };
              if (Object.values(next).some((v) => !Number.isFinite(v) || v < 0)) {
                toast.error("Enter amounts of 0 or more");
                return;
              }
              settingsDb.set(() => next);
              toast.success("Settings saved");
            }}
          >
            <F label="Free standard delivery over (₹)">
              <input
                name="free"
                type="number"
                min={0}
                defaultValue={s.freeDeliveryThreshold}
                className={inputCls}
              />
            </F>
            <F label="Standard delivery fee (₹)">
              <input
                name="std"
                type="number"
                min={0}
                defaultValue={s.standardFee}
                className={inputCls}
              />
            </F>
            <F label="Express delivery fee (₹)">
              <input
                name="exp"
                type="number"
                min={0}
                defaultValue={s.expressFee}
                className={inputCls}
              />
            </F>
            <button className={btnPrimary}>Save</button>
          </form>
        </Card>
        <Card className="space-y-4">
          <h2 className="font-display text-xl">Payment Configuration</h2>
          <div className="rounded-lg border border-gold/40 bg-gold/5 p-3.5 text-sm">
            <span className="font-semibold text-foreground block">Cash on Delivery (COD)</span>
            <p className="mt-1 text-xs text-muted-foreground">
              Cash on Delivery is active as the sole payment method. Customers place orders directly
              without online payment, and payments are collected at doorstep delivery.
            </p>
          </div>
          <h2 className="pt-2 font-display text-xl">Demo data</h2>
          <div className="flex flex-wrap gap-3">
            <ConfirmButton
              title="Restore original catalogue?"
              description="All 36 original products and categories will be restored. Products you added or edited will be lost."
              confirmLabel="Restore"
              onConfirm={() => {
                productsDb.reset();
                categoriesDb.reset();
                toast.success("Catalogue restored");
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm"
            >
              Restore products
            </ConfirmButton>
            <ConfirmButton
              title="Delete all demo orders?"
              description="All demo orders on this device will be removed. Stock is not changed."
              confirmLabel="Delete orders"
              onConfirm={() => {
                ordersDb.reset();
                toast.success("Orders cleared");
              }}
              className="rounded-lg border border-destructive px-4 py-2 text-sm text-destructive"
            >
              Clear orders
            </ConfirmButton>
          </div>
          <h2 className="pt-2 font-display text-xl">Admin passcode</h2>
          <ConfirmButton
            title="Change passcode?"
            description="You'll be signed out and asked to create a new passcode."
            onConfirm={() => {
              adminAuth.resetPasscode();
              void navigate({ to: "/admin/login" });
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm"
          >
            Change passcode
          </ConfirmButton>
        </Card>
      </div>
    </>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}
