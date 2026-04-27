export function StorageDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={className ?? "text-xs text-slate-500 dark:text-zinc-500"}
    >
      E2EE uploads keep decryption keys in the URL fragment (`#k=`), so the
      server cannot decrypt those files. Legacy mode remains available for
      compatibility and is server-decryptable.
    </p>
  );
}
