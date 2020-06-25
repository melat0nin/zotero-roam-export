# Zotero to Roam Export
**A Zotero addon for exporting to Roam's JSON format. Exports single or multiple items, as well as collections.**

<img src="https://user-images.githubusercontent.com/912688/84125772-f691e800-aa34-11ea-8729-a75b41e3dd08.png" alt="Screenshot of Zotero item exported to Roam" width="450" />

The initial motivation is to get [Zotfile](https://zotfile.com)-extracted highlights and annotations, along with an item's metadata, into Roam. This allows for **block-level referencing of those highlights, underlined sections, and annotations**. Although the exporter works without Zotfile, some of the optional settings below are designed for a Zotfile or Zotfile-like workflow.

## Download

Grab the xpi from the [releases page](https://github.com/melat0nin/zotero-roam-export/releases), and install by choosing `Install Add-on from File...` from the cog menu in Zotero's Add-ons Manager.

**Requires Zotero 5.0.**

## Instructions

Right-click an item, items, or collection, and choose `Export to Roam`. Save the export file, and upload into Roam using `Import Files` from the `...` menu.

### Optional features

1. **Include recursive collection names as topics** (v1.7+)<br/>
   You can include the names of the full hierarchy of an item's parent collections as topics, which is useful if you nest collections in a taxonomy in Zotero. To enable this, set the `extensions.roamexport.recursive_collection_topics` option to `true` in Zotero's Config Editor.
   
2. **Automatically convert underlines in Zotero notes to headings in Roam pages** (v1.8+)<br/>
   Any underlined paragraph in a Zotero note will become an H3 heading in Roam. Particularly useful if you use underline PDF annotations to reflect headings within the annotated document, as distinct from highlights to reflect body text. To enable, set the `extensions.roamexport.convert_underline_to_heading` option to `true` in Zotero's Config Editor.
   
3. **Always indent a specific tag type** (v1.8+)<br/>
   Specify a tag that will always be made a child of the preceding element, e.g. `<blockquote>`s always being indented under the paragraph they follow. This can be used, for example, to follow-up highlights with blockquoted notes:<br/><br/><img src="https://user-images.githubusercontent.com/912688/85718009-fdcc1d80-b6e5-11ea-9647-a26921e39589.png" width="250"/><br/>To enable, specify your desired tag in the `extensions.roamexport.indent_tag_as_child` option in Zotero's Config Editor. In the example above, the value is "`<blockquote>`".

2. **Using an item's citekey as Roam's page title** (v1.6+)<br/>
   If you use [Better Bibtex](https://retorque.re/zotero-better-bibtex/), you may wish to export items using their citekeys as the Roam page's title (see discussion of this workflow [here](https://github.com/melat0nin/zotero-roam-export/issues/7)). To enable this, set the `extensions.roamexport.citekey_as_title` option to `true` in Zotero's Config Editor.

---

Thanks to [@retorquere](https://github.com/retorquere/) for help refactoring for Zotero's async architecture.
