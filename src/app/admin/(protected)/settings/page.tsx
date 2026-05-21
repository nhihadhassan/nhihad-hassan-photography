import { brandConfig } from "@/lib/config";
import { EmptyState } from "@/components/empty-state";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <p className="text-sm font-medium text-[#9b744f]">Brand controls</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#17130f]/60">
          Keeping settings lightweight for Phase 3A. Editable site settings can be added after gallery CRUD is stable.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-6">
          <p className="text-sm text-[#17130f]/55">Brand name</p>
          <p className="mt-2 text-xl font-semibold">{brandConfig.name}</p>
        </div>
        <div className="rounded-md border border-[#17130f]/10 bg-[#fbf8f1] p-6">
          <p className="text-sm text-[#17130f]/55">Contact email</p>
          <p className="mt-2 text-xl font-semibold">{brandConfig.contactEmail}</p>
        </div>
      </div>
      <div className="mt-8">
        <EmptyState
          title="Settings are still config-backed."
          description="Phase 3B or 3C can make site_settings editable for hero image, SEO, contact details, and featured gallery controls."
        />
      </div>
    </div>
  );
}

