import { create } from "zustand";

interface UIState {
    sidebarOpen: boolean;
    selectedEntityId: string | null;
    viewport: { x: number; y: number; zoom: number };
    toggleSidebar: () => void;
    selectEntity: (id: string | null) => void;
    setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    selectedEntityId: null,
    viewport: { x: 0, y: 0, zoom: 1 },
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    selectEntity: (id) => set({ selectedEntityId: id }),
    setViewport: (viewport) => set({ viewport }),
}));
