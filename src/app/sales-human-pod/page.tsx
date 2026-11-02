import type { Metadata } from "next";
import { HumanPodPage } from "@/components/revenue-os";

export const metadata: Metadata = {
  title: "Sales Human Pod — Spark AI Sales OS",
  description:
    "Meet the growth team you don’t have to hire. One coordinated Human Pod for marketing, automation, content, lead follow-up and customer conversion.",
};

export default function SalesHumanPodPage() {
  return <HumanPodPage />;
}
