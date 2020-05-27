let zre = {};

zre.itemHasFields = function(item) {
    return item.getField('title') &&
        item.getCreators().length > 0;
};

// For parsing note HTML into clean(er) markdown
zre.cleanHtml = function (html) {
    // TODO this is hacky as all hell
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
};

zre.getItemType = function(item) {
    var zoteroType = Zotero.ItemTypes.getName(item.getField("itemTypeID")),
        type;
    // Adapted from Zotero RDF translator -- https://github.com/zotero/translators/blob/master/Zotero%20RDF.js
    if (item.url && (item.url.includes("arxiv") || item.url.includes("ssrn"))) {
        type = "Preprint";
    } else if (zoteroType == "book") {
        type = "Book";
    } else if (zoteroType == "bookSection") {
        type = "Chapter";
    } else if (zoteroType == "journalArticle") {
        type = "Article";
    } else if (zoteroType == "magazineArticle") {
        type = "Magazine article";
    } else if (zoteroType == "newspaperArticle") {
        type = "Newspaper article";
    } else if (zoteroType == "thesis") {
        type = "Thesis";
    } else if (zoteroType == "letter") {
        type = "Letter";
    } else if (zoteroType == "manuscript") {
        type = "Manuscript";
    } else if (zoteroType == "interview") {
        type = "Interview";
    } else if (zoteroType == "film") {
        type = "Film";
    } else if (zoteroType == "artwork") {
        type = "Illustration";
    } else if (zoteroType == "webpage") {
        type = "Webpage";
    } else if (zoteroType == "report") {
        type = "Report";
    } else if (zoteroType == "bill") {
        type = "Legislation";
    } else if (zoteroType == "case") {
        type = "Legal case";
    } else if (zoteroType == "hearing") {
        type = "Hearing";
    } else if (zoteroType == "patent") {
        type = "Patent";
    } else if (zoteroType == "statute") {
        type = "Legislation";
    } else if (zoteroType == "email") {
        type = "Letter";
    } else if (zoteroType == "map") {
        type = "Image";
    } else if (zoteroType == "blogPost") {
        type = "Blog post";
    } else if (zoteroType == "instantMessage") {
        type = "Instant message";
    } else if (zoteroType == "forumPost") {
        type = "Forum post";
    } else if (zoteroType == "audioRecording") {
        type = "Recording";
    } else if (zoteroType == "presentation") {
        type = "Presentation";
    } else if (zoteroType == "videoRecording") {
        type = "Recording";
    } else if (zoteroType == "tvBroadcast") {
        type = "TV broadcast";
    } else if (zoteroType == "radioBroadcast") {
        type = "Radio broadcast";
    } else if (zoteroType == "podcast") {
        type = "Podcast";
    } else if (zoteroType == "computerProgram") {
        type = "Data";
    } else if (zoteroType == "encyclopediaArticle") {
        type = "Encyclopaedia article";
    } else if (zoteroType == "conferencePaper") {
        type = "Conference paper";
    }
    return type;
};

zre.getItemAuthors = function(item) {
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

zre.getItemRelatedItems = function(item) {
    var relatedItemUris = item.getRelations()["dc:relation"],
        relatedItemsArray = [];

    for (let uri of relatedItemUris) {
        var itemID = Zotero.URI.getURIItemID(uri);
        var relatedItem = Zotero.Items.get(itemID);
        relatedItemsArray.push("[[" + relatedItem.getField("title") + "]]");
    }

    return relatedItemsArray;
}

zre.getItemCollections = function(item) {
    var collectionIds = item.getCollections(), collectionsArray = [];
    for (let id of collectionIds) {
        var collection = Zotero.Collections.get(id);
        collectionsArray.push("[[" + collection.name + "]]");
    }
    return collectionsArray;
}

zre.getItemMetadata = function(item) {
    var metadata = {},
        itemAuthors = [];
    metadata.string = "Metadata";
    metadata.heading = 3;
    metadata.children = [];
    if (item.getCreators().length > 0) {
        metadata.children.push({
            "string": "Author(s):: " + zre.getItemAuthors(item)
        });
    }
    metadata.children.push({
        "string": "Topics:: " + zre.getItemCollections(item).join(", ")
    });
    metadata.children.push({
        "string": "Type:: [[" + zre.getItemType(item) + "]]"
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
            "string": "Related:: " + zre.getItemRelatedItems(item).join(", ")
        });
    }
    return metadata;
};

zre.getItemNotes = function(item) {
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
                "string": zre.cleanHtml(para)
            });
        };
        noteArray.splice(0, 1); // Don't repeat the first line (been used as heading)
        thisNoteObj.children = noteArray;
        notes.children.push(thisNoteObj);
    }
    return notes;
}

// Get individual item's data
zre.gatherItemData = function(item) {
    var roamItem = {},
        itemChildren = [];
    roamItem.title = item.getField("title");
    var metadata = zre.getItemMetadata(item); // Get item metadata
    itemChildren.push(metadata);
    if (item.getNotes().length) { // Get notes if there
       var notes = zre.getItemNotes(item);
       itemChildren.push(notes);
    }
    roamItem.children = itemChildren;
    roamItem["edit-time"] = Date.parse(item.getField("dateModified")) / 1000;

    return roamItem;
}

zre.exportItems = function() {
    var items = Zotero.getActiveZoteroPane().getSelectedItems(), allItemsData = [];
    for (let item of items) {
        if (zre.itemHasFields(item)) {
            roamItem = zre.gatherItemData(item);
            allItemsData.push(roamItem);
        };
    };
    if (allItemsData.length) { zre.writeExport(allItemsData); }
};

zre.exportCollections = function() {
    var collection = Zotero.getActiveZoteroPane().getSelectedCollection(), allItemsData = [];
    var items = collection.getChildItems();
    for (let item of items) {
        if (zre.itemHasFields(item)) {
            roamItem = zre.gatherItemData(item);
            allItemsData.push(roamItem);
        };
    };
    if (allItemsData.length) { zre.writeExport(allItemsData); }
};


zre.writeExport = function(data) {
    Zotero.debug(JSON.stringify(data, null, "\t"));
    var tmpDir = Zotero.getTempDirectory().path;
    var exportFile = OS.Path.join(tmpDir, "roam-export.json");
    Zotero.File.putContentsAsync(exportFile, JSON.stringify(data));
}


if (!window.Zotero) window.Zotero = {};
if (!window.Zotero.RoamExport) window.Zotero.RoamExport = {};
window.Zotero.RoamExport.exportItems = function() {
    zre.exportItems();
};
window.Zotero.RoamExport.exportCollections = function() {
    zre.exportCollections();
};

if (typeof module !== 'undefined') module.exports = RoamExport;
