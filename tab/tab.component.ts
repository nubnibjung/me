import { booleanAttribute, ChangeDetectionStrategy, Component, ContentChild, Input, SimpleChanges, TemplateRef } from '@angular/core'
import { BaseComponent } from '@gofive/design-system-base'
import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'

@Injectable()
export class TabComponentService {
	imgSrc$ = new Subject<any>()
	headerText$ = new Subject<any>()
	badge$ = new Subject<any>()

	imgSrcChanged() {
		this.imgSrc$.next(null)
	}

	headerTextChanged() {
		this.headerText$.next(null)
	}

	badgeChanged(newBadge: string) {
		this.badge$.next({ newBadge })
	}
}

@Component({
    selector: 'go5-tab',
    templateUrl: './tab.component.html',
    styleUrls: ['./tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
})
export class TabComponent extends BaseComponent {
	@Input() imgSrc?: string
	@Input() headerText?: string
	@Input() content?: string
	@Input() badge?: string
	@Input({ transform: booleanAttribute }) disabled: boolean = false
	@Input('data-testid') testId?: string
	
	@ContentChild('headerTemplate', { static: true, read: TemplateRef }) headerTemplate: TemplateRef<any> | undefined

	@ContentChild('contentTemplate', { static: true, read: TemplateRef }) contentTemplate: TemplateRef<any> | undefined
	constructor(private tabComponentService: TabComponentService) {
		super()
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes?.headerText?.currentValue) {
			this.tabComponentService.headerTextChanged()
		}

		if (changes?.badge?.currentValue >= 0) {
			this.tabComponentService.badgeChanged(changes.badge.currentValue)
		}

		if (changes?.headerText?.currentValue) {
			this.tabComponentService.imgSrcChanged()
		}
	}
}
