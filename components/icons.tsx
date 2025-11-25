import React from 'react';
import { LogoIconComponent } from './icons/LogoIconComponent';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = LogoIconComponent;

const createIcon = (path: React.ReactNode) => (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    {path}
  </svg>
);

const createOutlineIcon = (path: React.ReactNode) => (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        {path}
    </svg>
);

// Centralized dictionary for all icon SVG path data
const iconPaths = {
  Bars3Icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />,
  FolderIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />,
  PlusIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />,
  SearchIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />,
  CheckCircleIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  XCircleIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  MinusCircleIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
  SlashCircleIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />,
  SparklesIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 00-1.49-1.49L12.75 18.75l1.188-.648a2.25 2.25 0 001.49-1.49l.648-1.188.648 1.188a2.25 2.25 0 001.49 1.49l1.188.648-1.188.648a2.25 2.25 0 00-1.49 1.49z" />,
  PaperClipIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3.375 3.375 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.687 7.687a1.125 1.125 0 01-1.591-1.591l7.687-7.687a1.125 1.125 0 011.591 1.591z" />,
  ChatBubbleLeftEllipsisIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />,
  CircleStackIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />,
  ChartPieIcon: <><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></>,
  ClipboardDocumentCheckIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />,
  DocumentTextIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
  ClipboardDocumentListIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75c0-.231-.035-.454-.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5" />,
  ClipboardDocumentSearchIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2.25-4h.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18V6.75c0-.621.504-1.125 1.125-1.125h.375m12.158 3.842l-3.328-3.328A2.25 2.25 0 0012.158 6H9" />,
  BeakerIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.21 1.002L7.5 15.25l-2.04-5.426a2.25 2.25 0 01-.21-1.002V3.104a2.25 2.25 0 012.25-2.25h1.5a2.25 2.25 0 012.25 2.25zM15 3.75a2.25 2.25 0 012.25 2.25v11.25a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25V6a2.25 2.25 0 012.25-2.25m9 0h-9" />,
  ShieldCheckIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />,
  ExclamationTriangleIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />,
  ClockIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
  XMarkIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
  Cog6ToothIcon: <><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h3m-6.75 3h13.5M3.75 12h16.5m-16.5 3H12m-8.25 3h13.5" transform="rotate(45 12 12)"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0 4.142-3.358 7.5-7.5 7.5s-7.5-3.358-7.5-7.5 3.358-7.5 7.5-7.5 7.5 3.358 7.5 7.5z" /></>,
  AcademicCapIcon: <><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-3.376 3.376a59.942 59.942 0 003.376-3.376z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.25 10.399a48.567 48.567 0 01-2.658-.813m15.482 0a48.567 48.567 0 00-2.658-.813M12 21.75V3.493" /></>,
  ChartBarSquareIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />,
  CalendarDaysIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008zm-3 0h.008v.008H9v-.008zm-3 0h.008v.008H6v-.008zm-3 0h.008v.008H3v-.008zm6 3h.008v.008H9v-.008zm-3 0h.008v.008H6v-.008zm6 0h.008v.008H12v-.008zm-3 0h.008v.008H9v-.008z" />,
  UsersIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 00-12 0m12 0a9.094 9.094 0 01-12 0m12 0v-2.25a6 6 0 00-12 0v2.25m12 0a9.094 9.094 0 01-12 0M12 12.75a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" />,
  LightBulbIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a2.4 2.4 0 01-3.75 0M14.25 18v-5.25m0 0a6.01 6.01 0 00-1.5-.189m1.5.189a6.01 6.01 0 011.5-.189m-3.75 7.478a12.06 12.06 0 014.5 0M12 4.5a3.75 3.75 0 00-3.75 3.75v1.5a3.75 3.75 0 007.5 0v-1.5A3.75 3.75 0 0012 4.5z" />,
  PencilIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />,
  TrashIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />,
  BuildingOffice2Icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12M6.75 3v.75m.75-.75v.75m-.75 0h.75m5.25 0h.75m-.75 0v.75m.75-.75v.75M9 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m-4.5 0H9" />,
  CheckBadgeIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />,
  MagnifyingGlassIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />,
  InformationCircleIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  MoonIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />,
  SunIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />,
  BellIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.31 5.632l-.01.012a23.848 23.848 0 005.454 1.31M15 17.25a3 3 0 01-6 0m4.5 0a9 9 0 00-9 0" />,
  EyeIcon: <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
  EyeSlashIcon: <><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" /></>,
  SpinnerIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-11.667-11.667l3.181 3.183A8.25 8.25 0 0118.015 15a8.25 8.25 0 01-11.667 0l-3.181-3.183" />,
  IdentificationIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
  ArrowPathIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-11.667-11.667l3.181 3.183A8.25 8.25 0 0118.015 15a8.25 8.25 0 01-11.667 0l-3.181-3.183" />,
  ChevronLeftIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />,
  ChevronRightIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />,
  ChevronDownIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />,
  ShareIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 100-2.186m0 2.186a2.25 2.25 0 100-2.186" />,
  PlayIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />,
  StopCircleIcon: <><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.254 9.254 9 9.563 9h4.874c.309 0 .563.254.563.563v4.874c0 .309-.254.563-.563.563H9.563C9.254 15 9 14.746 9 14.437V9.563z" /></>,
  DiamondIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.324H21a.563.563 0 01.324.96l-4.218 3.065a.563.563 0 00-.182.635l1.601 4.887a.563.563 0 01-.84.635L12 18.066a.563.563 0 00-.656 0l-4.218 3.065a.563.563 0 01-.84-.635l1.601-4.887a.563.563 0 00-.182-.635L2.676 13.06a.563.563 0 01.324-.96h5.882a.563.563 0 00.475-.324L11.48 3.5z" transform="rotate(45 12 12) scale(0.9)" />,
  PauseCircleIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  PlayCircleIcon: <><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" /></>,
  UserCircleIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />,
  GlobeAltIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 013 12c0-.778.099-1.533.284-2.253m0 0a11.953 11.953 0 0119.432 0" />,
  PhotoIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />,
  UploadIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />,
  DownloadIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />,
  CogIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1115 0m-15 0H3" />,
  ServerStackIcon: <><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 21H3a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 013 3h18a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0121 21h-3.75m-10.5 0V12.75m10.5 0V21" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 9.75h.75" /></>,
};

// --- Outline Icons ---
export const Bars3Icon = createOutlineIcon(iconPaths.Bars3Icon);
export const FolderIcon = createOutlineIcon(iconPaths.FolderIcon);
export const PlusIcon = createOutlineIcon(iconPaths.PlusIcon);
export const SearchIcon = createOutlineIcon(iconPaths.SearchIcon);
export const CheckCircleIcon = createOutlineIcon(iconPaths.CheckCircleIcon);
export const XCircleIcon = createOutlineIcon(iconPaths.XCircleIcon);
export const MinusCircleIcon = createOutlineIcon(iconPaths.MinusCircleIcon);
export const SlashCircleIcon = createOutlineIcon(iconPaths.SlashCircleIcon);
export const SparklesIcon = createOutlineIcon(iconPaths.SparklesIcon);
export const PaperClipIcon = createOutlineIcon(iconPaths.PaperClipIcon);
export const ChatBubbleLeftEllipsisIcon = createOutlineIcon(iconPaths.ChatBubbleLeftEllipsisIcon);
export const CircleStackIcon = createOutlineIcon(iconPaths.CircleStackIcon);
export const ChartPieIcon = createOutlineIcon(iconPaths.ChartPieIcon);
export const ClipboardDocumentCheckIcon = createOutlineIcon(iconPaths.ClipboardDocumentCheckIcon);
export const DocumentTextIcon = createOutlineIcon(iconPaths.DocumentTextIcon);
export const ClipboardDocumentListIcon = createOutlineIcon(iconPaths.ClipboardDocumentListIcon);
export const ClipboardDocumentSearchIcon = createOutlineIcon(iconPaths.ClipboardDocumentSearchIcon);
export const BeakerIcon = createOutlineIcon(iconPaths.BeakerIcon);
export const ShieldCheckIcon = createOutlineIcon(iconPaths.ShieldCheckIcon);
export const ExclamationTriangleIcon = createOutlineIcon(iconPaths.ExclamationTriangleIcon);
export const ClockIcon = createOutlineIcon(iconPaths.ClockIcon);
export const XMarkIcon = createOutlineIcon(iconPaths.XMarkIcon);
export const Cog6ToothIcon = createOutlineIcon(iconPaths.Cog6ToothIcon);
export const AcademicCapIcon = createOutlineIcon(iconPaths.AcademicCapIcon);
export const ChartBarSquareIcon = createOutlineIcon(iconPaths.ChartBarSquareIcon);
export const CalendarDaysIcon = createOutlineIcon(iconPaths.CalendarDaysIcon);
export const UsersIcon = createOutlineIcon(iconPaths.UsersIcon);
export const LightBulbIcon = createOutlineIcon(iconPaths.LightBulbIcon);
export const PencilIcon = createOutlineIcon(iconPaths.PencilIcon);
export const TrashIcon = createOutlineIcon(iconPaths.TrashIcon);
export const BuildingOffice2Icon = createOutlineIcon(iconPaths.BuildingOffice2Icon);
export const CheckBadgeIcon = createOutlineIcon(iconPaths.CheckBadgeIcon);
export const MagnifyingGlassIcon = createOutlineIcon(iconPaths.MagnifyingGlassIcon);
export const InformationCircleIcon = createOutlineIcon(iconPaths.InformationCircleIcon);
export const MoonIcon = createOutlineIcon(iconPaths.MoonIcon);
export const SunIcon = createOutlineIcon(iconPaths.SunIcon);
export const BellIcon = createOutlineIcon(iconPaths.BellIcon);
export const EyeIcon = createOutlineIcon(iconPaths.EyeIcon);
export const EyeSlashIcon = createOutlineIcon(iconPaths.EyeSlashIcon);
export const SpinnerIcon = createOutlineIcon(iconPaths.SpinnerIcon);
export const IdentificationIcon = createOutlineIcon(iconPaths.IdentificationIcon);
export const ArrowPathIcon = createOutlineIcon(iconPaths.ArrowPathIcon);
export const ChevronLeftIcon = createOutlineIcon(iconPaths.ChevronLeftIcon);
export const ChevronRightIcon = createOutlineIcon(iconPaths.ChevronRightIcon);
export const ChevronDownIcon = createOutlineIcon(iconPaths.ChevronDownIcon);
export const ShareIcon = createOutlineIcon(iconPaths.ShareIcon);
export const PlayIcon = createOutlineIcon(iconPaths.PlayIcon);
export const StopCircleIcon = createOutlineIcon(iconPaths.StopCircleIcon);
export const DiamondIcon = createOutlineIcon(iconPaths.DiamondIcon);
export const PauseCircleIcon = createOutlineIcon(iconPaths.PauseCircleIcon);
export const PlayCircleIcon = createOutlineIcon(iconPaths.PlayCircleIcon);
export const UserCircleIcon = createOutlineIcon(iconPaths.UserCircleIcon);
export const GlobeAltIcon = createOutlineIcon(iconPaths.GlobeAltIcon);
export const PhotoIcon = createOutlineIcon(iconPaths.PhotoIcon);
export const UploadIcon = createOutlineIcon(iconPaths.UploadIcon);
export const DownloadIcon = createOutlineIcon(iconPaths.DownloadIcon);
export const CogIcon = createOutlineIcon(iconPaths.CogIcon);
export const ServerStackIcon = createOutlineIcon(iconPaths.ServerStackIcon);

// --- Solid Icons (if any needed) ---
// Example: export const SolidPlusIcon = createIcon(iconPaths.PlusIcon);
