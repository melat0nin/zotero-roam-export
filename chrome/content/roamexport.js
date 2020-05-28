const typemap = {
    artwork: "Illustration",
    audioRecording: "Recording",
    bill: "Legislation",
    blogPost: "Blog post",
    book: "Book",
    bookSection: "Chapter",
    "case": "Legal case",
    computerProgram: "Data",
    conferencePaper: "Conference paper",
    email: "Letter",
    encyclopediaArticle: "Encyclopaedia article",
    film: "Film",
    forumPost: "Forum post",
    hearing: "Hearing",
    instantMessage: "Instant message",
    interview: "Interview",
    journalArticle: "Article",
    letter: "Letter",
    magazineArticle: "Magazine article",
    manuscript: "Manuscript",
    map: "Image",
    newspaperArticle: "Newspaper article",
    patent: "Patent",
    podcast: "Podcast",
    presentation: "Presentation",
    radioBroadcast: "Radio broadcast",
    report: "Report",
    statute: "Legislation",
    thesis: "Thesis",
    tvBroadcast: "TV broadcast",
    videoRecording: "Recording",
    webpage: "Webpage",
}


Zotero.RoamExport = Zotero.RoamExport || new class {
    itemHasFields(item) {
        return item.getField('title') &&
            item.getCreators().length > 0;
    }

    getItemType(item) {
        var zoteroType = Zotero.ItemTypes.getName(item.getField("itemTypeID")),
            type;
        if (item.url && (item.url.includes("arxiv") || item.url.includes("ssrn"))) {
            return "Preprint";
        } else {
            return typemap[zoteroType];
        }
    }

    getItemAuthors(item) {
        var creators = item.getCreators(),
            authorsArray = [],
            authorsString;
        for (let creator of creators) {
            if (creator.creatorTypeID == Zotero.CreatorTypes.getID('author')) {
                var authString = "";
                if (creator.firstName) authString += creator.firstName;
                if (creator.lastName) authString += " " + creator.lastName;
                authString = "[[" + Zotero.Utilities.trim(authString) + "]]";
                authorsArray.push(authString);
            }
        }
        authorsString = authorsArray.join(", ");
        return authorsString;
    }

    getItemRelatedItems(item) {
        var relatedItemUris = item.getRelations()["dc:relation"],
            relatedItemsArray = [];

        for (let uri of relatedItemUris) {
            var itemID = Zotero.URI.getURIItemID(uri);
            var relatedItem = Zotero.Items.get(itemID);
            relatedItemsArray.push("[[" + relatedItem.getField("title") + "]]");
        }

        return relatedItemsArray;
    }

    getItemCollections(item) {
        var collectionIds = item.getCollections(),
            collectionsArray = [];
        for (let id of collectionIds) {
            var collection = Zotero.Collections.get(id);
            collectionsArray.push("[[" + collection.name + "]]");
        }
        return collectionsArray;
    }

    getItemMetadata(item) {
        var metadata = {},
            itemAuthors = [];
        metadata.string = "Metadata";
        metadata.heading = 3;
        metadata.children = [];
        if (item.getCreators().length > 0) {
            metadata.children.push({
                "string": "Author(s):: " + this.getItemAuthors(item)
            });
        }
        metadata.children.push({
            "string": "Topics:: " + this.getItemCollections(item).join(", ")
        });
        metadata.children.push({
            "string": "Type:: [[" + this.getItemType(item) + "]]"
        });
        if (item.getField("date")) {
            metadata.children.push({
                "string": "Date:: " + item.getField("year")
            });
        }
        if (item.getAttachments().length > 0) {
            var attachments = Zotero.Items.get(item.getAttachments()),
                attachmentLinks = [];
            for (let attachment of attachments) {
                if (attachment.attachmentContentType == "application/pdf") {
                    let attString = "[" + attachment._displayTitle + "](zotero://open-pdf/library/items/" + attachment.key + ")";
                    attachmentLinks.push(attString);
                }
            }
            metadata.children.push({
                "string": "Zotero PDF(s):: " + attachmentLinks.join(", ")
            });
        }
        if (item.getField("url")) {
            var itemUrl = item.getField("url");
            metadata.children.push({
                "string": "URL:: [" + itemUrl + "](" + itemUrl + ")"
            });
        }
        var itemTags = item.getTags();
        itemTags.push({"tag":"ZoteroImport"}); // Always include #ZoteroImport
        metadata.children.push({
            "string": "Tags:: " + itemTags.map(o => "#[[" + o.tag + "]]").join(", ")
        });
        if (item.relatedItems.length > 0) {
            metadata.children.push({
                "string": "Related:: " + this.getItemRelatedItems(item).join(", ")
            });
        }
        return metadata;
    }

    getItemNotes(item) {
        var notes = {},
            itemNotes = Zotero.Items.get(item.getNotes()),
            domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
                .createInstance(Components.interfaces.nsIDOMParser),
            mapObj = {"<p>":"","</p>":"","<strong>":"**","</strong>":"**","<b>":"**","</b>":"**",
                "<u>":"","</u>":"","<em>":"__","</em>":"__","<blockquote>":"> ","</blockquote>":""},
            re = new RegExp(Object.keys(mapObj).join("|"),"gi");

        notes.string = "Notes";
        notes.heading = 3;
        notes.children = [];

        for (let note of itemNotes) {
            var fullDomNote = domParser.parseFromString(note.getNote(), "text/html").body.childNodes, // The note's children
                thisNoteObject = {}, noteParasArray = [];
            thisNoteObject.string = "**" + note.getNoteTitle() + "**";
            for (let para of fullDomNote) {
                if (para.innerHTML) { // Check paragraph isn't empty
                    for (let link of para.getElementsByTagName('a')) { // Convert html links to markdown
                        link.outerHTML = "[" + link.text + "](" + link.href + ")";
                    }
                    var parsedInner = para.innerHTML.replace(re, function(matched){
                      return mapObj[matched];
                    });
                    para.innerHTML = parsedInner;
                    if (para.outerHTML.startsWith("<blockquote>")) { para.innerHTML = "> " + para.innerHTML; } // TODO: inelegant!
                    if (para.outerHTML.startsWith("<li>")) { para.innerHTML = "- " + para.innerHTML; }
                    if (para.outerHTML.startsWith("<ol>")) { para.innerHTML = "1. " + para.innerHTML; }
                    noteParasArray.push({
                        "string": para.textContent
                    });
                }
            }
            noteParasArray.splice(0, 1); // Remove note title (already stored)
            thisNoteObject.children = noteParasArray;
            notes.children.push(thisNoteObject);
        }
        return notes;
    }

    gatherItemData(item) { // Get individual item's data
        var roamItem = {},
            itemChildren = [];
        roamItem.title = item.getField("title");
        var metadata = this.getItemMetadata(item); // Get item metadata
        itemChildren.push(metadata);
        if (item.getNotes().length) { // Get notes if there
            var notes = this.getItemNotes(item);
            itemChildren.push(notes);
        }
        roamItem.children = itemChildren;
        roamItem["edit-time"] = Date.parse(item.getField("dateModified")) / 1000;

        return roamItem;
    }

    async exportItems() {
        await Zotero.Schema.schemaUpdatePromise;
        var items = Zotero.getActiveZoteroPane().getSelectedItems(),
            allItemsData = [];
        for (let item of items) {
            if (this.itemHasFields(item)) {
                var roamItem = this.gatherItemData(item);
                allItemsData.push(roamItem);
            };
        };
        if (allItemsData.length) {
            await this.writeExport(allItemsData);
        };
    }

    async exportCollections() {
        await Zotero.Schema.schemaUpdatePromise;
        var collection = Zotero.getActiveZoteroPane().getSelectedCollection(),
            allItemsData = [];
        var items = collection.getChildItems();
        for (let item of items) {
            if (this.itemHasFields(item)) {
                var roamItem = this.gatherItemData(item);
                allItemsData.push(roamItem);
            };
        };
        if (allItemsData.length) {
            await this.writeExport(allItemsData);
        }
    }

    async writeExport(data) {
        await Zotero.Schema.schemaUpdatePromise;
        var FilePicker = require('zotero/filePicker').default;
        var fp = new FilePicker();
        fp.init(window, "Save Roam export", fp.modeSave);
        fp.appendFilter("Roam JSON", "*.json");
        fp.defaultString = "roam-export.json";
        var rv = await fp.show();
		if (rv == fp.returnOK || rv == fp.returnReplace) {
			let outputFile = fp.file;
            if (outputFile.split('.').pop().toLowerCase() != "json") {
                outputFile += ".json";
            }
			Zotero.File.putContentsAsync(outputFile, JSON.stringify(data));
		}
    }

    // async helper to log errors
    run(method, ...args) {
        this[method].apply(this, args).catch(err => {
            Zotero.debug(err)
        })
    }
};
