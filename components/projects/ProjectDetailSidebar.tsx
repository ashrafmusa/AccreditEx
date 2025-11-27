                : 'text-brand-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default ProjectDetailSidebar;