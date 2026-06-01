export function BrandTitle({
  accent,
  rest,
}: {
  accent: string;
  rest: string;
}) {
  return (
    <h1 className="text-[22px] font-extrabold tracking-[0.25em] text-[#e8e0ff] ml-1">
      <span className="text-violet-400">{accent}</span>
      {rest}
    </h1>
  );
}
