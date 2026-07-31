import type { Metadata } from "next";
import SshTerminal from "../../components/SshTerminal";

export const metadata: Metadata = {
  title: "aryan@portfolio — ssh",
  description:
    "Command-line version of Aryan Dokania's portfolio. ls, cat, and ask the RAG agent from a terminal."
};

export default function SshPage() {
  return <SshTerminal />;
}
