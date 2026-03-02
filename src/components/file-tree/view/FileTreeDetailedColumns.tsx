export default function FileTreeDetailedColumns() {
  return (
    <div className="px-3 pt-1.5 pb-1 border-b border-border">
      <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        <div className="col-span-5">Name</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-3">Modified</div>
        <div className="col-span-2">Permissions</div>
      </div>
    </div>
  );
}
