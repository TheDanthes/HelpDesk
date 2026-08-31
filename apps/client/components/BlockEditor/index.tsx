import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useTheme } from "next-themes";


import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

export default function BlockNoteEditor({ setIssue }) {
  const editor = useCreateBlockNote();
  const { theme } = useTheme();

  return (
    <div className="rounded-md border border-border/60 bg-background/60 p-2">
      <BlockNoteView
        //@ts-ignore
        editor={editor}
        sideMenu={false}
        theme={theme === "dark" ? "dark" : "light"}
        className="min-h-[180px] bg-transparent"
        onChange={() => {
          setIssue(editor.document);
        }}
      />
    </div>
  );
}
