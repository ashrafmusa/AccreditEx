# 🗺️ Process Map Editor - Quick Reference

## 🎯 Getting Started

### Opening the Editor
1. Go to **Document Control Hub**
2. Click on any **Process Map** document
3. The editor opens in a full-screen modal

### Creating Your First Map
1. Click **"Add Node"** button
2. Select node type from dropdown
3. Enter a label
4. Press **Enter** or click **Add**
5. Drag nodes to arrange them
6. Connect nodes by dragging from the small circles on edges

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Delete` / `Backspace` | Delete selected items |
| `?` | Show help modal |

---

## 🎨 Node Types

### ▶️ Start Node (Green)
- **Purpose**: Beginning of process
- **Shape**: Rounded circle
- **Color**: Green gradient
- **Use**: Mark entry point

### ⚙️ Process Node (Blue)
- **Purpose**: Action or step
- **Shape**: Rectangle
- **Color**: Blue gradient
- **Use**: Main workflow steps

### ◆ Decision Node (Yellow)
- **Purpose**: Decision point
- **Shape**: Diamond
- **Color**: Yellow gradient
- **Use**: Yes/No questions, branches

### ⏹️ End Node (Red)
- **Purpose**: End of process
- **Shape**: Rounded circle
- **Color**: Red gradient
- **Use**: Mark exit point

---

## 🖱️ Mouse Controls

### Navigation
- **Pan Canvas**: Click and drag empty space
- **Zoom In/Out**: Mouse wheel or use zoom buttons
- **Fit View**: Click "Fit" button to see all nodes

### Node Operations
- **Move Node**: Click and drag node
- **Select Node**: Click node (blue outline appears)
- **Multi-Select**: Click and drag on canvas to select multiple
- **Delete**: Select node(s), press Delete key

### Creating Connections
1. Hover over node edge (small circles appear)
2. Click and drag from circle
3. Drag to target node
4. Release to connect

---

## 🛠️ Top Action Bar

| Button | Function |
|--------|----------|
| ↶ | Undo last action |
| ↷ | Redo undone action |
| 🔍+ | Zoom in |
| 🔍- | Zoom out |
| Fit | Fit all nodes in view |
| 📷 | Export as PNG image |

---

## 📋 Node Controls Panel

### Add Node
1. Click **"Add Node"** to expand panel
2. Select type: Start / Process / Decision / End
3. Enter label text
4. Press **Enter** or click **Add**

### Other Actions
- **Delete Selected**: Remove selected nodes/edges
- **Auto Layout**: Arrange nodes vertically
- **Clear All**: Delete entire map (requires confirmation)

---

## 💡 Pro Tips

### Efficient Workflows
- Use **Enter key** for quick node addition
- Hold **Shift** for straight connections (if supported)
- Use **Ctrl+Z** liberally - undo is unlimited
- Press **?** anytime for help

### Best Practices
- Start with a **Start Node**
- End with an **End Node**
- Use **Decision Nodes** for branches
- Keep labels short and clear
- Use **Auto Layout** for initial arrangement, then adjust

### Visual Organization
- Group related processes visually
- Use consistent spacing
- Minimize crossing connections
- Add decision nodes for clarity

---

## 📸 Exporting Your Map

### PNG Export
1. Click **📷** icon in top action bar
2. Wait for export (loading indicator shows)
3. File downloads automatically
4. Filename: `[DocumentName]_process_map.png`
5. Resolution: 1920x1080 high quality

### When to Export
- ✅ Final documentation
- ✅ Presentations
- ✅ Reports
- ✅ Training materials
- ✅ Archive/backup

---

## 💾 Saving Your Work

### Auto-Save Indicator
- **Yellow dot (●)**: Unsaved changes
- **No indicator**: All changes saved

### Saving
1. Make your changes
2. Click **"Save Changes"** button
3. Wait for confirmation
4. Document updated in Firestore

### Save Tips
- Save frequently during long sessions
- Unsaved indicator pulses to remind you
- Save button disabled when no changes
- Close button available anytime (warns on unsaved)

---

## 🎨 Visual Feedback

### Node States
- **Normal**: Static with shadow
- **Hover**: Scales up slightly
- **Selected**: Blue outline
- **Dragging**: Follows cursor

### Edge States
- **Normal**: Thin animated line
- **Hover**: Highlighted
- **Selected**: Thick blue line
- **Creating**: Follows cursor

---

## 🌙 Dark Mode

The Process Map Editor fully supports dark mode:
- Automatic theme detection
- Smooth transitions
- Readable text colors
- Adjusted gradients
- Proper contrast

Toggle dark mode in app settings.

---

## 🆘 Help & Support

### In-App Help
- Press **?** key anytime
- Click **?** icon in header
- Comprehensive guide with examples

### Help Modal Sections
1. **Basic Actions**: Mouse and keyboard operations
2. **Keyboard Shortcuts**: Complete reference
3. **Node Types**: Detailed descriptions

---

## 🚀 Quick Start Checklist

- [ ] Open process map document
- [ ] Add a Start node
- [ ] Add process steps
- [ ] Add decision points (if needed)
- [ ] Add an End node
- [ ] Connect nodes in sequence
- [ ] Use Auto Layout for tidiness
- [ ] Export PNG if needed
- [ ] Save changes

---

## 🔧 Troubleshooting

### Node Won't Connect
- ✓ Check if dragging from edge circle
- ✓ Ensure target node is valid
- ✓ Try from different edge point

### Can't See All Nodes
- ✓ Click "Fit" button
- ✓ Zoom out with mouse wheel
- ✓ Pan canvas by dragging

### Export Not Working
- ✓ Wait for loading indicator
- ✓ Check browser download settings
- ✓ Ensure nodes visible in viewport

### Changes Not Saving
- ✓ Check internet connection
- ✓ Verify unsaved changes indicator
- ✓ Try clicking Save Changes again

---

## 📊 Status Bar (Footer)

Shows real-time statistics:
- **Nodes Count**: Total nodes in map
- **Connections Count**: Total edges between nodes
- **Export Status**: "Exporting..." when generating PNG

---

## 🎯 Common Use Cases

### 1. Simple Linear Process
```
Start → Process 1 → Process 2 → Process 3 → End
```

### 2. Decision Tree
```
Start → Process → Decision
                 ├─→ Yes → Process A → End
                 └─→ No → Process B → End
```

### 3. Loop Process
```
Start → Process → Decision
                 ├─→ Continue → (back to Process)
                 └─→ Done → End
```

### 4. Parallel Paths
```
Start → Decision
        ├─→ Path A → End
        └─→ Path B → End
```

---

## 🎨 Color Legend (Footer Left)

Visible in editor bottom-left:
- 🟢 **Start** - Green circle
- 🔵 **Process** - Blue rectangle
- 🟡 **Decision** - Yellow diamond
- 🔴 **End** - Red circle

---

## ✅ Best Practices Summary

1. ✅ **Always start with Start node**
2. ✅ **Always end with End node**
3. ✅ **Use Decision nodes for branches**
4. ✅ **Keep labels concise**
5. ✅ **Avoid crossing connections**
6. ✅ **Use Auto Layout as starting point**
7. ✅ **Save frequently**
8. ✅ **Export for documentation**

---

## 🔥 Power User Tips

- **Rapid Node Creation**: Add Node → Label → Enter → Repeat
- **Quick Navigation**: Fit View → Zoom In on area
- **Undo Mistakes**: Ctrl+Z anytime, unlimited history
- **Clean Layout**: Auto Layout → Manual adjustments
- **Professional Output**: Export PNG at 1920x1080
- **Learn Shortcuts**: Press ? to see all shortcuts
- **Visual Hierarchy**: Use node spacing to show importance

---

## 📝 Version

**Process Map Editor v2.0**
- Enhanced UI/UX
- Undo/Redo system
- PNG export
- Keyboard shortcuts
- Help modal
- Dark mode support

Last Updated: December 2025
