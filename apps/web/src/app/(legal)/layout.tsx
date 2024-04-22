export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="container py-6">
      <div className="mx-auto w-full max-w-xl">{children}</div>
    </section>
  );
}
