import { Metadata } from "next";
import { Search } from "./search";

export const metadata: Metadata = {
  title: "Analytics",
  description: "View the analytics of a channel through Statistical.",
};

export default function AnalyticsSearch() {
  return (
    <section className="container py-6">
      <Search />
    </section>
  );
}
