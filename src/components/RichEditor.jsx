import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Markdown } from 'tiptap-markdown';
import { marked } from 'marked';
import classNames from 'classnames';
import { 
  Bold, Italic, Strikethrough, Code, 
  Heading1, Heading2, List, ListOrdered, 
  Quote, Image as ImageIcon, Link as LinkIcon 
} from 'lucide-react';

// Setup lowlight for syntax highlighting
const lowlight = createLowlight(common);

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const buttons = [
    {
      icon: <Bold size={18} />,
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      icon: <Italic size={18} />,
      title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      icon: <Strikethrough size={18} />,
      title: 'Strike',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike'),
    },
    {
      icon: <Code size={18} />,
      title: 'Code',
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive('code'),
    },
    {
      type: 'divider',
    },
    {
      icon: <Heading1 size={18} />,
      title: 'Heading 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
    },
    {
      icon: <Heading2 size={18} />,
      title: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
    },
    {
      icon: <List size={18} />,
      title: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      icon: <ListOrdered size={18} />,
      title: 'Ordered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
    {
      icon: <Quote size={18} />,
      title: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
    },
  ];

  return (
    <div 
      className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10"
      onClick={(e) => e.stopPropagation()} // Prevent bubble to DailyCard toggle
    >
      {buttons.map((btn, index) => (
        btn.type === 'divider' ? (
          <div key={index} className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        ) : (
          <button
            key={index}
            onMouseDown={(e) => e.preventDefault()} // Prevent focus loss on click
            onClick={(e) => {
              e.stopPropagation();
              btn.action();
            }}
            title={btn.title}
            className={classNames(
              'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
              { 'bg-gray-200 dark:bg-gray-700 text-blue-600': btn.isActive }
            )}
          >
            {btn.icon}
          </button>
        )
      ))}
    </div>
  );
};

const RichEditor = forwardRef(({ content, onChange, onHeadingsUpdate, editable = true }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use the lowlight extension instead
        heading: {
          HTMLAttributes: {
            class: 'font-bold text-gray-900 dark:text-gray-100', // Base styles
          },
          levels: [1, 2, 3],
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-outside ml-4',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-outside ml-4',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic',
          },
        },
      }).extend({
        // Override styles for specific levels
        addAttributes() {
            return {
                ...this.parent?.(),
                level: {
                    default: 1,
                    renderHTML: attributes => {
                        const classes = {
                            1: 'text-3xl mb-4 mt-2',
                            2: 'text-2xl mb-3 mt-2',
                            3: 'text-xl mb-2 mt-1',
                        }
                        return {
                            class: classes[attributes.level],
                        }
                    },
                },
            }
        }
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Markdown,
    ],
    content: marked(content || ''), // Initial content: Markdown -> HTML
    editable: editable,
    autofocus: 'end', // Auto-focus at the end
    onUpdate: ({ editor }) => {
      // Save as Markdown
      if (onChange) {
        onChange(editor.storage.markdown.getMarkdown());
      }
      
      // Update headings for TOC
      if (onHeadingsUpdate) {
        const headings = [];
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'heading') {
            headings.push({
              level: node.attrs.level,
              text: node.textContent,
              pos: pos,
            });
          }
        });
        onHeadingsUpdate(headings);
      }
    },
  });

  useImperativeHandle(ref, () => ({
    scrollToHeading: (pos) => {
      if (editor) {
        editor.commands.setTextSelection(pos);
        editor.commands.scrollIntoView();
        editor.commands.focus();
      }
    }
  }));

  // Update content if it changes externally (e.g. selecting a different file)
  useEffect(() => {
    if (editor && content !== undefined) {
      // Check if current editor content matches the new content (to avoid loop/cursor jump)
      // Since we convert MD <-> HTML, exact string match is hard.
      // We rely on the parent to only update `content` when switching files.
      // Or we can check if the editor is focused.
      if (!editor.isFocused) {
         editor.commands.setContent(marked(content || ''));
         
         // If editable changed to true, focus!
         if (editable) {
             editor.commands.focus('end');
         }
         
         // Also update headings initially
         const headings = [];
         editor.state.doc.descendants((node, pos) => {
           if (node.type.name === 'heading') {
             headings.push({
               level: node.attrs.level,
               text: node.textContent,
               pos: pos,
             });
           }
         });
         if (onHeadingsUpdate) {
            onHeadingsUpdate(headings);
         }
      }
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} className="flex-1 overflow-y-auto prose dark:prose-invert max-w-none p-4 focus:outline-none" />
    </div>
  );
});

RichEditor.displayName = 'RichEditor';

export default RichEditor;
