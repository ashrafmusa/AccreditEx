// Module declarations for packages without type definitions

declare module '@headlessui/react' {
    import { FC } from 'react';
    export const Dialog: FC<any> & { Panel: FC<any>; Title: FC<any>; Description: FC<any>; Overlay: FC<any> };
    export const Transition: FC<any> & { Child: FC<any>; Root: FC<any> };
    export const Tab: FC<any> & { Group: FC<any>; List: FC<any>; Panels: FC<any>; Panel: FC<any> };
    export const Menu: FC<any> & { Button: FC<any>; Items: FC<any>; Item: FC<any> };
    export const Listbox: FC<any> & { Button: FC<any>; Options: FC<any>; Option: FC<any>; Label: FC<any> };
    export const Combobox: FC<any> & { Input: FC<any>; Button: FC<any>; Options: FC<any>; Option: FC<any> };
    export const Switch: FC<any>;
    export const Disclosure: FC<any> & { Button: FC<any>; Panel: FC<any> };
    export const Popover: FC<any> & { Button: FC<any>; Panel: FC<any>; Group: FC<any>; Overlay: FC<any> };
    export const RadioGroup: FC<any> & { Option: FC<any>; Label: FC<any>; Description: FC<any> };
    export const Fragment: FC<any>;
}

declare module 'lucide-react' {
    import { FC, SVGProps } from 'react';
    type IconComponent = FC<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string; className?: string }>;
    // Allow any named export as an IconComponent
    export const TrendingUp: IconComponent;
    export const TrendingDown: IconComponent;
    export const Activity: IconComponent;
    export const AlertTriangle: IconComponent;
    export const CheckCircle: IconComponent;
    export const CheckCircle2: IconComponent;
    export const XCircle: IconComponent;
    export const Info: IconComponent;
    export const ArrowUp: IconComponent;
    export const ArrowDown: IconComponent;
    export const BarChart2: IconComponent;
    export const BarChart3: IconComponent;
    export const LineChart: IconComponent;
    export const PieChart: IconComponent;
    export const Download: IconComponent;
    export const RefreshCw: IconComponent;
    export const Filter: IconComponent;
    export const Settings: IconComponent;
    export const ChevronDown: IconComponent;
    export const ChevronUp: IconComponent;
    export const ChevronRight: IconComponent;
    export const ChevronLeft: IconComponent;
    export const Search: IconComponent;
    export const Plus: IconComponent;
    export const Minus: IconComponent;
    export const X: IconComponent;
    export const Eye: IconComponent;
    export const EyeOff: IconComponent;
    export const Copy: IconComponent;
    export const Clipboard: IconComponent;
    export const FileText: IconComponent;
    export const Save: IconComponent;
    export const Upload: IconComponent;
    export const Trash2: IconComponent;
    export const Edit: IconComponent;
    export const Calendar: IconComponent;
    export const Clock: IconComponent;
    export const Users: IconComponent;
    export const User: IconComponent;
    export const Mail: IconComponent;
    export const Phone: IconComponent;
    export const Globe: IconComponent;
    export const Lock: IconComponent;
    export const Unlock: IconComponent;
    export const Shield: IconComponent;
    export const ShieldCheck: IconComponent;
    export const Database: IconComponent;
    export const Server: IconComponent;
    export const Cloud: IconComponent;
    export const CloudOff: IconComponent;
    export const Wifi: IconComponent;
    export const WifiOff: IconComponent;
    export const Zap: IconComponent;
    export const Star: IconComponent;
    export const Heart: IconComponent;
    export const ThumbsUp: IconComponent;
    export const ThumbsDown: IconComponent;
    export const MessageSquare: IconComponent;
    export const Send: IconComponent;
    export const Paperclip: IconComponent;
    export const Image: IconComponent;
    export const Video: IconComponent;
    export const Mic: IconComponent;
    export const Bell: IconComponent;
    export const BellOff: IconComponent;
    export const Home: IconComponent;
    export const Map: IconComponent;
    export const Navigation: IconComponent;
    export const Compass: IconComponent;
    export const Layers: IconComponent;
    export const Grid: IconComponent;
    export const List: IconComponent;
    export const Table: IconComponent;
    export const Layout: IconComponent;
    export const LayoutGrid: IconComponent;
    export const Sidebar: IconComponent;
    export const Menu: IconComponent;
    export const MoreHorizontal: IconComponent;
    export const MoreVertical: IconComponent;
    export const ExternalLink: IconComponent;
    export const Link: IconComponent;
    export const Maximize: IconComponent;
    export const Minimize: IconComponent;
    export const Move: IconComponent;
    export const RotateCw: IconComponent;
    export const RotateCcw: IconComponent;
    export const Loader: IconComponent;
    export const AlertCircle: IconComponent;
    export const HelpCircle: IconComponent;
    export const Hash: IconComponent;
    export const Tag: IconComponent;
    export const Bookmark: IconComponent;
    export const Flag: IconComponent;
    export const Target: IconComponent;
    export const Crosshair: IconComponent;
    export const Award: IconComponent;
    export const Package: IconComponent;
    export const Box: IconComponent;
    export const Archive: IconComponent;
    export const Folder: IconComponent;
    export const FolderOpen: IconComponent;
    export const File: IconComponent;
    export const FileCheck: IconComponent;
    export const FilePlus: IconComponent;
    export const FileMinus: IconComponent;
    export const Code: IconComponent;
    export const Terminal: IconComponent;
    export const Palette: IconComponent;
    export const Paintbrush: IconComponent;
    export const Scissors: IconComponent;
    export const CircleDot: IconComponent;
    export const Workflow: IconComponent;
    export const Gauge: IconComponent;
    export const Sparkles: IconComponent;
    export const Sun: IconComponent;
    export const Moon: IconComponent;
    export const Lightbulb: IconComponent;
    export const MousePointer2: IconComponent;
    export const Check: IconComponent;
    // Allow any other named import
}

declare module '@tiptap/extension-highlight' {
    export const Highlight: any;
    export default Highlight;
}

declare module '@tiptap/extension-color' {
    export const Color: any;
    export default Color;
}

declare module '@tiptap/extension-text-style' {
    export const TextStyle: any;
    export default TextStyle;
}

declare module '@tiptap/extension-mention' {
    export const Mention: any;
}

declare module 'tippy.js' {
    const tippy: any;
    export default tippy;
    export type Instance = any;
    export type Props = any;
}

declare module 'marked' {
    export interface MarkedOptions {
        renderer?: any;
        gfm?: boolean;
        breaks?: boolean;
        [key: string]: any;
    }
    export const marked: {
        (text: string, options?: MarkedOptions): string;
        setOptions: (options: MarkedOptions) => void;
        parse: (text: string, options?: MarkedOptions) => string;
    };
}

declare module 'zod' {
    export const z: any;
    export type ZodSchema = any;
    export type ZodType = any;
    export type infer<T> = any;
    export default z;
}
