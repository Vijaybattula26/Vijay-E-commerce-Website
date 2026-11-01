import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, SiteLayout, btnPrimary, inputCls } from "@/components/store/SiteLayout";
import { isEmail } from "@/lib/commerce";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => seo("Contact us", "Get in touch with THE VIJAY STORE about products and orders."),
  component: Contact,
});

function Contact() {
  const [f, setF] = useState({ name: "", email: "", msg: "" });
  return (
    <SiteLayout>
      <PageHeader eyebrow="Get in touch" title="Contact us" />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border bg-card p-6 text-sm">
          <p>
            <strong>Email:</strong> [store email]
          </p>
          <p>
            <strong>Phone / WhatsApp:</strong> [phone number]
          </p>
          <p>
            <strong>Address:</strong> [store address]
          </p>
          <p>
            <strong>Hours:</strong> [opening hours]
          </p>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!f.name.trim() || !isEmail(f.email) || f.msg.trim().length < 5) {
              toast.error("Please fill in all fields correctly");
              return;
            }
            toast.success("Message noted (demo)", {
              description: "Messages aren't sent anywhere yet.",
            });
            setF({ name: "", email: "", msg: "" });
          }}
          className="space-y-3 rounded-xl border border-border bg-card p-6"
        >
          <input
            aria-label="Name"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            placeholder="Name"
            className={inputCls}
          />
          <input
            aria-label="Email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            placeholder="Email"
            className={inputCls}
          />
          <textarea
            aria-label="Message"
            value={f.msg}
            onChange={(e) => setF({ ...f, msg: e.target.value })}
            rows={4}
            placeholder="Message"
            className={inputCls}
          />
          <button className={`${btnPrimary} w-full`}>Send message</button>
        </form>
      </div>
    </SiteLayout>
  );
}
