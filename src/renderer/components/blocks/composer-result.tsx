export const ComposerResult = ({ result }) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Result</h2>
      {result && <div className="text-sm">{result}</div>}
    </div>
  );
};
