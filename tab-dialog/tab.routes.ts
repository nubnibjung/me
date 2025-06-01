import { Routes } from '@angular/router'

export const TAB_ROUTES: Routes = [
    {
        path: 'go5-tab-dialog-v2',
        loadComponent: () =>
            import('./tab-dialog.component').then(
                (m) => m.TabDialogComponent,
            ),
        title: 'Tab Dialog Component',
    },
]
