# Zotero to Roam Export
A Zotero addon for exporting to Roam's JSON format. Exports single or multiple items, as well as collections.

<img src="https://user-images.githubusercontent.com/912688/84125772-f691e800-aa34-11ea-8729-a75b41e3dd08.png" alt="Screenshot of Zotero item exported to Roam" width="450" />

## Download

Grab the xpi from the [releases page](https://github.com/melat0nin/zotero-roam-export/releases), and install by choosing `Install Add-on from File...` from the cog menu in Zotero's Add-ons Manager.

**Requires Zotero 5.0.**

## Instructions

Right-click an item, items, or collection, and choose `Export to Roam`. Save the export file, and upload into Roam using `Import Files` from the `...` menu.

### Optional features

#### Using an item's citekey as Roam's page title

If you use [Better Bibtex](https://retorque.re/zotero-better-bibtex/), you may wish to export items using their citekeys as the Roam page's title (see discussion of this workflow [here](https://github.com/melat0nin/zotero-roam-export/issues/7)). To enable this, set the `extensions.roamexport.citekey_as_title` option to `true` in Zotero's Config Editor (v1.6+) 

---

Thanks to [@retorquere](https://github.com/retorquere/) for help refactoring for Zotero's async architecture.
