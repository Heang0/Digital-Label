import DigitalLabelGrid from "@/components/digital/DigitalLabelGrid";

export default function DigitalLabelsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Digital Labels</h1>
      <p className="text-sm text-gray-600 mt-1">
        This page simulates your real supermarket digital labels.
      </p>

      <div className="mt-6">
        <DigitalLabelGrid />
      </div>
    </div>
  );
}
