const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    UnderlineType,
    ImageRun,
} = require("docx");
const PDFDocument = require("pdfkit");
const MarkdownIt = require("markdown-it");
const Book = require("../models/Book");
const path = require("path");
const fs = require("fs");

const md = new MarkdownIt();

// Typography configuration matching the PDF export

const DOCX_STYLES = {
    fonts: {
        body: "Charter",
        heading: "Inter",
    },
    sizes: {
        title: 32,
        subtitle: 20,
        author: 18,
        chapterTitle: 24,
        h1: 20,
        h2: 18,
        h3: 16,
        body: 12,
    },
    spacing: {
        paragraphBefore: 200,
        paragraphAfter: 200,
        chapterBefore: 400,
        chapterAfter: 300,
        headingBefore: 300,
        headingAfter: 150,
    },
};

// Process markdown content into docx paragraphs
const processMarkdownToDocs = (markdown) => (
    const tokens = nd.parse(markdown, {};
        const Paragraphs = [];
        let inList = false;
        let listType = null;
        let orderedCounter = 1;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            try (
                if (token.type === "heading_open") {
                    const level = parseInt(token.tag.subString(1), 10);
                    const nextToken = tokens[i + 1];

                    if (nextToken && nextToken.type === "inline") {
                        let headingLevel;
                        let fontSize;

                        switch (level) {
                            case 1:
                                headingLevel = HeadingLevel.HEADING_1;
                                fontSize = DOCX_STYLES.sizes.h1;
                                break;
                            case 2:
                                headingLevel = HeadingLevel.HEADING_2;
                                fontSize = DOCX_STYLES.sizes.h2;
                                break;
                            case 3:
                                headingLevel = HeadingLevel.HEADING_3;
                                fontSize = DOCX_STYLES.sizes.h3;
                        }

                        Paragraphs.push(
                            new Paragraph({
                                text: nextToken.content,
                                heading: headingLevel,
                                spacing: {
                                    before: DOCX_STYLES.spacing.headingBefore,
                                    after: DOCX_STYLES.spacing.headingAfter,

                                },
                            })
                        );

                        i += 2; //skip inline and heading_close
                    }
                } else if (token.type === "paragraph_open") {
                    const nextToken = tokens(i+1);

                    if (nextToken && nextToken.type === "inline" && nextToken.children) {
                        const TextRuns = processInlineContent(nextToken.children);

                        if (TextRuns.length > 0) {
                            Paragraphs.push(
                                new Paragraph({
                                    children: TextRuns,
                                    spacing: {
                                        before: inList ? 100 :  DOCX_STYLES.spacing.paragraphBefore,
                                        after: inList ? 100 : DOCX_STYLES.spacing.paragraphAfter,
                                        line: 360,
                                    },
                                    alignment: AlignmentType.JUSTIFIED,
                                })
                            );
                        }

                        i+=2;
                    }
                  } else if (token.type === "bullet_list_open") {
                    inList = true;
                    listType = "bullet";
                  } else if (token.type === "bullet_list_close") {
                    inList = false;
                    listType = null;

                    // Add spacing after list
                    Paragraphs.push(new paragraph({ text: "", spacing: { after: 100}})); 
                  } else if (token.type === "ordered_list_open"){
                    inList = true;
                    listType = "ordered";
                    orderedCounter = 1;
                  } else if (token.type === "ordered_list_close"){
                    inList = false;
                    listType = null;
                    orderedCounter = 1;
                    Paragraphs.push(new Paragraph({ text: "", spacing: { after: 100}}));

                  } else if (token.type === "list_item_open") {
                    const nextToken = tokens[i+1];

                    if (nextToken && nextToken.type === "paragraph_open") {
                        const inlineToken = token[i+2];

                        if (
                            inlineToken &&
                            inlineToken.type === "inline" &&
                            inlineToken.children
                        ) {
                            const TextRuns = processInlineContent(inlineToken.children);

                            let bulletText = "";
                            if (listType === "bullet") {
                                bulletText = ". ";
                            } else if (listType === "ordered") {
                                bulletText = `${orderedCounter}.`;
                                orderedCounter++;
                            }
                            
                            Paragraphs.push(
                                newParagraph({
                                    children: [
                                        new TextRun({
                                            text: bulletText,
                                            font: DOCX_STYLES.fonts.body,
                                        }),
                                        ...TextRuns,
                                    ],
                                    spacing: { before: 50, after: 50},
                                    indent: { left: 720 }, // 0.5 inch indent
                                })
                            );

                            i+=4; // skip paragraph_open, inline, paragraph_close, list_item_close
                        }
                    }
                  } else if (token.type === "blockquote_open") {
                    // Find the blockquote content
                    const nextToken = tokens[i+1];
                    if(nextToken && nextToken.type === "paragraph_open") {
                        const inlineToken = token[i+2];
                        if ( inlineToken && inlineToken.type === "inline") {
                            Paragraphs.push(
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: inlineToken.content,
                                            italics: true,
                                            color: "666666",
                                            font: DOCX_STYLES.fonts.body,
                                        }),
                                    ],
                                    spacing: { before: 200, after: 200 },
                                    indent: { left: 720 },
                                    alignment: AlignmentType.JUSTIFIED,
                                    border: {
                                        left: {
                                            color: "4F46E5",
                                            space: 1,
                                            style: "single",
                                            size: 24,
                                        },
                                    },
                                })
                            );
                            i+=4;
                        }
                    }
                  }
                    
                  }
                    
                
            )

        }
        
    )
)

const exportAsDocument = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }

        if (book.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not Authorized" });
        }

        const sections = [];

        // Cover page with image if available
        const coverPage = [];

        if (book.coverImage && !book.coverImage.includes("pravatar")) {
            const imagePath = book.coverImage.substring(1);

            try {
                if (fs.existsSync(imagePath)) {
                    const imageBuffer = fs.readFileSync(imagePath);

                    // Add some top spacing
                    coverPage.push(
                        new Paragraph({
                            text: "",
                            spacing: { before: 1000},
                        })
                    );

                    // Add image centered on page
                    coverPage.push(
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: imageBuffer,
                                    transformation: {
                                    width: 400, // Width in pixels
                                    height: 550, // Height in pixels
                                    },
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 200, after: 400},

                        })
                    );

                    // Page break after cover
                    coverPage.push(
                        newParagraph({
                            text:"",
                            pageBreakBefore: true,
                        })
                    );
                }
            } catch (imgErr) {
                console.error(`could not embed image: ${imagePath}`, imgErr);

            }
        }

        sections.push(...coverPage);

        // Title page section
        const titlePage = [];

        // Main title
        titlePage.push(
            new Paragraph({
                children: [
                    next TextRun({
                        text: book.title,
                        bold: true,
                        font: DOCX_STYLES.fonts.eading,h
                        size: DOCS_STYLES.sizes.title * 2,
                        color: "1A202C",
                    }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 2000, after: 400 },
            })
        );

        // Subtitle if exists
        if (book.subtitle && book.subtitle.trim()) {
            titlePage.push(
                newParagraph({
                    children: [
                        new TextRun({
                            text: book.subtitle,
                            font: DOCX_STYLES.fonts.heading,
                            size: DOCX_STYLES.sizes.subtitle * 2,
                            color: "4A5568",
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                })
            );
        }

        // Author
        titlePage.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `by ${book.author}`,
                        font: DOCX_STYLES.fonts.heading,
                        size: DOCX_STYLES.sizes.author * 2,
                        color: "2D3748",
                    }),
                ],
                alignment: AlignmentType.,
                spacing: { after: 200 },
            })
        );

        // Decorative line
        titlePage.push(
            new Paragraph({
                text: "",
                border: {
                    bottom: {
                        color: "4F46ES",
                        space: 1,
                        style: "single",
                        size: 12,
                    },
                },
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 },

            })
        );

        sections.push(...titlePage);

        // Process chapters
        book.chapters.forEach((chapter, index)) => {
            try {
                // Page break before each chapter (except first)
                if (index > 0) {
                    sections.push(
                        new Paragraph({
                            text: "",
                            pageBreakBefore: true,
                        })
                    );
                }

                // Chapter title
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: chapter.title,
                                bold: true,
                                font: DOCX_STYLES.fonts.heading,
                                size: DOCX_STYLES.sizes.chapterTitle * 2,
                                color: "1A202C",
                            }),
                        ],
                        spacing: {
                            before: DOCX_STYLES.spacing.chapterBefore,
                            after: DOCX_STYLES.spacing.chapterAfter,
                        },
                    })
                );

                // Chapter content
                const contentParagraphs = processMarkdownToDocs(chapter.content || "");
                sections.push(...contentParagraphs);
            } catch (chapterError) {
                console.error(`Error processing chapter ${index}:`, chapterError);
            }
        });

        // Create the document
        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: 1440, // 1 inch
                                right: 1440,
                                bottom: 1440,
                                left: 1440,
                            },
                        },
                    },
                    children: sections,
                },
            ],
        });

        // Generate the document buffer
        const buffer = await Packer.toBuffer(doc);

        // Send the document
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${book.title.replace(/[^a-z0-9]/g, "_")}.docx"`
        );
        res.setHeader("content-Length", buffer.length);

        res.send(buffer);
    } catch (error) {
        console.error("Error exporting document:", error);
        if (!res.headerSent) {
            res.status(500).json({
                message: "Server error during document export",
                error: error.message,
            });
        }
    }
};
        
        
    

