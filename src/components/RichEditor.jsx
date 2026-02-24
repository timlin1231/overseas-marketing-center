
import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { common, createLowlight } from 'lowlight';
import { Markdown } from 'tiptap-markdown';
import { marked } from 'marked';
import classNames from 'classnames';
import { 
  Bold, Italic, Strikethrough, Code, 
  Heading1, Heading2, List, ListOrdered, 
  Quote, Table as TableIcon
} from 'lucide-react';

// Setup lowlight for syntax highlighting
const lowlight = createLowlight(common);

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const buttons = [
    {
      icon: <Bold size={16} />,
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      icon: <Italic size={16} />,
      title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      icon: <Strikethrough size={16} />,
      title: 'Strike',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike'),
    },
    {
      icon: <Code size={16} />,
      title: 'Code',
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive('code'),
    },
    {
      type: 'divider',
    },
    {
      icon: <Heading1 size={16} />,
      title: 'Heading 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
    },
    {
      icon: <Heading2 size={16} />,
      title: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
    },
    {
      icon: <List size={16} />,
      title: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      icon: <ListOrdered size={16} />,
      title: 'Ordered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
    {
      icon: <Quote size={16} />,
      title: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
    },
    {
      type: 'divider',
    },
    {
      icon: <TableIcon size={16} />,
      title: 'Insert Table',
      action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      isActive: editor.isActive('table'),
    },
  ];

  return (
    <div 
      className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 transition-all duration-200"
      onClick={(e) => e.stopPropagation()} 
    >
      {buttons.map((btn, index) => (
        btn.type === 'divider' ? (
          <div key={index} className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-2" />
        ) : (
          <button
            key={index}
            onMouseDown={(e) => e.preventDefault()} 
            onClick={(e) => {
              e.stopPropagation();
              btn.action();
            }}
            title={btn.title}
            className={classNames(
              'p-1.5 rounded-md transition-all duration-200 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-black dark:hover:text-white hover:shadow-sm',
              { 'bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700': btn.isActive }
            )}
          >
            {btn.icon}
          </button>
        )
      ))}
    </div>
  );
};

const RichEditor = forwardRef(({ 
  content, 
  onChange, 
  onHeadingsUpdate, 
  editable = true, 
  autoFocus = false,
  proseClass = "prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none dark:prose-invert max-w-4xl py-8 px-4" 
}, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown,
    ],
    editorProps: {
      attributes: {
        class: proseClass,
      },
    },
    content: marked(content || ''), 
    editable: editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.storage.markdown.getMarkdown());
      }
      
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

  useEffect(() => {
    if (editor && content !== undefined) {
      if (!editor.isFocused) {
         editor.commands.setContent(marked(content || ''));
         
         // Update headings initially
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

  useEffect(() => {
    if (editor && editable && autoFocus) {
      editor.commands.focus('end');
    }
  }, [editor, editable, autoFocus]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black group">
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} className="flex-1 overflow-y-auto tiptap focus:outline-none" />
    </div>
  );
});

RichEditor.displayName = 'RichEditor';

export default RichEditor;
