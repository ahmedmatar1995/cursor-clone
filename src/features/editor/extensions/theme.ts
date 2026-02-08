import { EditorView } from "codemirror";

export const customTheme = EditorView.theme({
  "&": {
    outline: "none !important",
    height: "100%",
  },
  ".cm-content": {
    fontFamily: "Roboto, sans-serif",
    fontSize: "15px",
  },
  ".cm-scroller": {
    scrollbarWidth: "thin",
    scrollbarColor: "#3f3f46 transparent",
  },
});
