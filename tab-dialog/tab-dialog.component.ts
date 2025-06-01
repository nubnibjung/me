import { Dialog } from '@angular/cdk/dialog'
import { Component, inject } from '@angular/core'
import { TabDialogV2Component } from 'projects/navigation/src/public-api'

@Component({
	selector: 'app-tab-dialog',
	standalone: true,
	imports: [TabDialogV2Component],
	templateUrl: './tab-dialog.component.html',
	styleUrl: './tab-dialog.component.scss',
})
export class TabDialogComponent {
	dialog = inject(Dialog)

	openDialog() {
		const lastIndex = 9 // แท็บสุดท้าย index 9

		const dataSource = [
			{ id: 1, name: 'Tab 1', code: 'A', selected: false, data: { message: 'Hello from Tab 1' } },
			{ id: 2, name: 'Tab 2', code: 'B', selected: false, data: { message: 'Hello from Tab 2' } },
			{ id: 3, name: 'Tab 3', code: 'C', selected: false, data: { message: 'Hello from Tab 3' } },
			{ id: 4, name: 'Tab 4', code: 'D', selected: false, data: { message: 'Hello from Tab 4' } },
			{ id: 5, name: 'Tab 5', code: 'E', selected: false, data: { message: 'Hello from Tab 5' } },
			{ id: 6, name: 'Tab 6', code: 'F', selected: false, data: { message: 'Hello from Tab 6' } },
			{ id: 7, name: 'Tab 7', code: 'G', selected: false, data: { message: 'Hello from Tab 7' } },
			{ id: 8, name: 'Tab 8', code: 'H', selected: false, data: { message: 'Hello from Tab 8' } },
			{ id: 9, name: 'Tab 9', code: 's', selected: false, data: { message: 'Hello from Tab 9' } },
			{ id: 10, name: 'i', code: 'J', selected: true, data: { message: 'Hello from Tab 10' } },
		]

		const dialogRef = this.dialog.open(TabDialogV2Component, {
			data: {
				prevTitle: 'Previous Title',
				dataSource,
				formatComponentInputs: (item: any) => ({ data: item.data }),
				width: '1000px',
				isFullScreen: false,
				isAllowedMinimize: true,
			},
			width: '1000px',
			height: '700px',
		})

		setTimeout(() => {
			const instance = dialogRef.componentInstance
			if (!instance) return

			const indexToSelect = lastIndex
			const longName = 'This is a very long tab name for testing full display of tab header'

			instance.dataSource.update((items) => {
				return items.map((item, i) => {
					if (i === indexToSelect) {
						return {
							...item,
							name: longName,
							selected: true,
						}
					}
					return {
						...item,
						selected: false,
					}
				})
			})
			const originalOnSelectTab = instance.onSelectTab.bind(instance)
			originalOnSelectTab({ index: indexToSelect })
		}, 1000)
	}
}
