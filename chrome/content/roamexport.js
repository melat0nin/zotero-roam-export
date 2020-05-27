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

Zotero.RoamResearch = Zotero.RoamResearch || new class {
    itemHasFields(item) {
        return item.getField('title') &&
            item.getCreators().length > 0;
    }

    // For parsing note HTML into clean(er) markdown
    cleanHtml(html) {
        // This is hacky as all hell
        // TODO: refactor to use DOMParser
        var cleanhtml = html.replace('<strong>', '**')
            .replace('</strong>', '**')
            .replace("<em>", "__")
            .replace("</em>", "__")
            .replace("<blockquote>", "> ")
            .replace("<u>", "^^")
            .replace("</u>", "^^"); // Convert styles to markdown
        // TODO ZU.parseMarkup to find anchor tags? https://github.com/zotero/zotero/blob/4.0/chrome/content/zotero/xpcom/utilities.js#L525
        cleanhtml = cleanhtml.replace(/([^+>]*)[^<]*(<a [^>]*(href="([^>^\"]*)")[^>]*>)([^<]+)(<\/a>[)])/gi, "$1___$2 ([$5]($4))"); // Convert anchors to markdown
        cleanhtml = cleanhtml.replace(/<[^>]*>?/gm, ""); // Strip remaining tags
        // TODO retain soft linebreaks within the paragraph
        return cleanhtml;
    }

    getItemType(item) {
        var zoteroType = Zotero.ItemTypes.getName(item.getField("itemTypeID"));

        // Adapted from Zotero RDF translator -- https://github.com/zotero/translators/blob/master/Zotero%20RDF.js
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
        var collectionIds = item.getCollections(), collectionsArray = [];
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
            var attachments = Zotero.Items.get(item.getAttachments()), attachmentLinks = [];
            Zotero.debug(attachments);
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
        if (item.getTags().length > 0) {
            itemTags = item.getTags();
            metadata.children.push({
                "string": "Tags:: " + itemTags.map(o => "#[[" + o.tag + "]]").join(", ")
            });
        }
        if (item.relatedItems.length > 0) {
            metadata.children.push({
                "string": "Related:: " + this.getItemRelatedItems(item).join(", ")
            });
        }
        return metadata;
    }

    getItemNotes(item) {
        var notes = {}, itemNotes = Zotero.Items.get(item.getNotes());
        notes.string = "Notes";
        notes.heading = 3;
        notes.children = [];

        for (let note of itemNotes) {
            var parasArray = note.getNote().split("\n"), // Convert linebreaks to individual nodes/blocks
                thisNoteObj = {},
                noteArray = [];
            thisNoteObj.string = "**" + note.getNoteTitle() + "**"; // Take first line as note's heading
            for (let para of parasArray) {
                noteArray.push({
                    "string": this.cleanHtml(para)
                });
            };
            noteArray.splice(0, 1); // Don't repeat the first line (been used as heading)
            thisNoteObj.children = noteArray;
            notes.children.push(thisNoteObj);
        }
        return notes;
    }

    // Get individual item's data
    gatherItemData(item) {
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
    };

    async exportItems() {
        var items = Zotero.getActiveZoteroPane().getSelectedItems(), allItemsData = [];
        for (let item of items) {
            if (this.itemHasFields(item)) {
                roamItem = this.gatherItemData(item);
                allItemsData.push(roamItem);
            };
        };
        if (allItemsData.length) { await this.writeExport(allItemsData); }
    };

    async exportCollections() {
        var collection = Zotero.getActiveZoteroPane().getSelectedCollection(), allItemsData = [];
        var items = collection.getChildItems();
        for (let item of items) {
            if (this.itemHasFields(item)) {
                roamItem = this.gatherItemData(item);
                allItemsData.push(roamItem);
            };
        };
        if (allItemsData.length) { await this.writeExport(allItemsData); }
    };

    async writeExport(data) {
        Zotero.debug(JSON.stringify(data, null, "\t"));
        var tmpDir = Zotero.getTempDirectory().path;
        var exportFile = OS.Path.join(tmpDir, "roam-export.json");
        await Zotero.File.putContentsAsync(exportFile, JSON.stringify(data));
    }

    // async helper to log errors
    run(method, ...args) {
        this[method].apply(this, args).catch(err => {
            Zotero.debug(err)
        })
    }
}
