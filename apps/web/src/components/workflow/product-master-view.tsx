interface ProductMasterViewProps {
  productId: string;
  onRefresh: () => void;
}

export default function ProductMasterView(_props: ProductMasterViewProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Product Analysis</h2>

      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-4xl">🔍</div>
          <div>
            <h3 className="font-semibold text-blue-900">AI Analysis</h3>
            <p className="text-sm text-blue-800 mt-1">
              Upload product photos and click analyze to create your Product Master.
            </p>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            Product Master will contain:
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✓ Product name & description</li>
            <li>✓ Key strengths & benefits</li>
            <li>✓ Target customer & use cases</li>
            <li>✓ SEO keywords</li>
            <li>✓ Specifications & SKU</li>
            <li>✓ Safety & claim validation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
