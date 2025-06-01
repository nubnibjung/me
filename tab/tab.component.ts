import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ContentChild,
	ContentChildren,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnChanges,
	OnDestroy,
	output,
	Output,
	QueryList,
	SimpleChanges,
	TemplateRef,
	ViewChild,
	ViewChildren,
} from '@angular/core'
import { Configuration } from '@gofive/angular-common'
import { BaseComponent } from '@gofive/design-system-base'
import { DropdownSelectMode, DropdownModule } from '@gofive/design-system-dropdown'
import { Subject, Subscription, BehaviorSubject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import { TabComponent, TabComponentService } from './tab/tab.component'
import { TabScrollDirective } from './tab-directive/tab-scroll-directive/tab-scroll.directive'
import { CommonModule } from '@angular/common'
import { TabHeaderDirective } from './tab-directive/tab-header-directive/tab-header.directive'
import { DomSanitizer } from '@angular/platform-browser'
import { TooltipModule } from '@gofive/design-system-tooltip'
import { AvatarModule, AvatarSize } from '@gofive/design-system-avatar'

export enum TabCategories {
	Primary = 'primary',
	Secondary = 'secondary',
	Tertiary = 'tertiary',
}

export enum TabHeaderTextSize {
	Medium = 'medium',
	Small = 'small',
}

@Component({
	selector: 'go5-tabs',
	templateUrl: './tabs.component.html',
	styleUrls: ['./tabs.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: true,
	imports: [CommonModule, TabScrollDirective, TabHeaderDirective, DropdownModule, TooltipModule, AvatarModule],
	providers: [TabComponentService],
})
export class TabsComponent extends BaseComponent implements AfterViewInit, OnChanges, OnDestroy {
	@ViewChild('headerElement') headerElementRef: ElementRef | undefined
	@ViewChild('contentElement') contentElementRef: ElementRef | undefined
	@ViewChildren('paragraphRef') paragraphRefs!: QueryList<ElementRef>

	@Input() allowTabs?: boolean = false // mode multiple tabs
	@Input() activeIndex: number = 0
	@Input() contentPadding: string = '20px 24px'
	@Input() headerPadding: string = '20px 24px 0 0'
	@Input() headerRightMinWidth: string = ''
	@Input() isShowBorder: boolean = true
	@Input() allowScroll: boolean = false
	@Input() autoHeight: boolean = false
	@Input() category: TabCategories = TabCategories.Primary
	@Input() isShowDropdown: boolean = true
	@Input() headerTextSize: TabHeaderTextSize = TabHeaderTextSize.Medium
	@Input() themeLight?: boolean = false
	@Input('go5-tooltip') isTextTooltip?: string

	@Output() removeIndexChange: EventEmitter<any> = new EventEmitter<any>()
	@Output() activeIndexChange: EventEmitter<any> = new EventEmitter<any>()
	@Output() changed: EventEmitter<any> = new EventEmitter<any>()
	@Output() selected: EventEmitter<any> = new EventEmitter<any>()
	@Output('selectChange') select: EventEmitter<any> = new EventEmitter<any>()

	hoveredTab = output<boolean>()

	@ContentChild('headerRightTemplate', { static: true, read: TemplateRef }) headerRightTemplate:
		| TemplateRef<any>
		| undefined
	@ContentChildren(TabComponent) tabs: QueryList<TabComponent> | null = null

	public tab: TabComponent | undefined

	public overFlowTab: any[] = []

	public fieldsTab: any = { text: 'headerText', value: 'value' }

	public contentHeight?: string

	public prefixTestId: string = 'tab_'

	public smallType = TabHeaderTextSize.Small
	public mediumType = TabHeaderTextSize.Medium
	public avatarSizeCustom = AvatarSize.Custom

	public paragraphRef$ = new BehaviorSubject<ElementRef<HTMLElement> | undefined>(undefined)

	get TabCategories() {
		return TabCategories
	}

	get DropdownSelectMode() {
		return DropdownSelectMode
	}

	@HostListener('window:resize')
	sizeChange() {
		if (this.autoHeight) this.setNextHeight()
		if (this.allowScroll) this.setOverFlowTab()
	}

	setHeight() {
		if (this.elementRef?.nativeElement?.parentElement && this.headerElementRef) {
			this.contentHeight =
				'calc(' +
				(this.elementRef.nativeElement.parentElement.clientHeight - this.headerElementRef.nativeElement.clientHeight) +
				'px' +
				(this.contentElementRef?.nativeElement.style.paddingTop
					? ' - ' + this.contentElementRef?.nativeElement.style.paddingTop
					: '') +
				')'

			this._cdr.detectChanges()
		}
	}

	private _setOverflow$: Subject<any> = new Subject()
	private _setOverFlowSubscription$: Subscription = new Subscription()
	private _tabChanges$: Subscription | undefined = new Subscription()
	private _setHeight$: Subject<any> = new Subject()
	private _setHeightSubscription$: Subscription = new Subscription()
	private _language$: Subscription = new Subscription()

	constructor(
		public elementRef: ElementRef,
		private _cdr: ChangeDetectorRef,
		private tabComponentService: TabComponentService,
		private sanitizer: DomSanitizer,
	) {
		super()
		this.tabComponentService.headerText$.subscribe(() => {
			if (this.allowScroll) {
				this.setOverFlowTab()
				setTimeout(() => {
					requestAnimationFrame(() => {
						this.scrollToCurrentTab()
					})
				}, 150)
			}

			setTimeout(() => {
				this._cdr.detectChanges()
			}, 150)
		})
		this._language$ = Configuration.languageChange.subscribe(() => {
			if (this.allowScroll) {
				this.setOverFlowTab()
			}
			if (this.autoHeight) {
				this.setNextHeight()
			}
		})
		this._setOverFlowSubscription$ = this._setOverflow$.pipe(debounceTime(100)).subscribe(() => {
			this.checkTabOverflow()
		})

		this._setHeightSubscription$ = this._setHeight$.pipe(debounceTime(20)).subscribe(() => {
			this.setHeight()
		})

		this.tabComponentService.badge$.subscribe((changed) => {
			if (changed) {
				this._cdr.detectChanges()
			}
		})
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.activeIndex?.currentValue >= 0) {
			this.activeIndex = changes.activeIndex.currentValue
			this.onChangeContent()
		}
	}

	ngAfterViewInit(): void {
		this.onChangeContent()
		if (this.allowScroll) {
			this.setOverFlowTab()
		}
		if (this.autoHeight) {
			this.setNextHeight()
		}
		this._tabChanges$?.unsubscribe()
		this._tabChanges$ = this.tabs?.changes.subscribe(() => {
			if (this.allowScroll) {
				this.setOverFlowTab()
			}
		})
		setTimeout(() => {
			if (this.tabs !== null && this.tabs.length > 0) {
				this.changeTab(this.tabs.length - 1, true)
			}
		}, 300)
	}

	ngOnDestroy(): void {
		this._setOverFlowSubscription$?.unsubscribe()
		this._setHeightSubscription$?.unsubscribe()
		this._tabChanges$?.unsubscribe()
		this._language$?.unsubscribe()
	}

	changeTab(index: number, isScrollToCurrentTab = false) {
		if (this.activeIndex === index) return

		const tempTab = this.tabs?.get(index)
		if (tempTab && tempTab?.disabled) return

		const modelSelect = {
			name: 'select',
			index: index,
			cancel: false,
			value: index,
		}
		this.select.emit(modelSelect)
		if (modelSelect.cancel) return
		this.activeIndex = index
		this.tab = tempTab
		this.activeIndexChange.emit(this.activeIndex)

		const modelChanged = {
			name: 'changed',
			index: this.activeIndex,
			value: this.activeIndex,
		}

		const modelSelected: any = {
			...modelChanged,
			name: 'selected',
		}

		this.scrollToCurrentTab()
		this.changed.emit(modelChanged)
		this.selected.emit(modelSelected)
		this._cdr.detectChanges()
	}
	scrollToCurrentTab() {
		const scrollLeft = this.headerElementRef?.nativeElement.scrollLeft + this.headerElementRef?.nativeElement.offsetLeft
		const clientWidth = this.headerElementRef?.nativeElement.clientWidth
		let amount = this.headerElementRef?.nativeElement.children.length - 1

		if (
			this.headerElementRef &&
			((this.headerElementRef.nativeElement.children[this.activeIndex] as HTMLElement)?.offsetLeft >
				scrollLeft +
					clientWidth -
					(this.headerElementRef.nativeElement.children[this.activeIndex] as HTMLElement)?.clientWidth ||
				(this.headerElementRef.nativeElement.children[this.activeIndex] as HTMLElement)?.offsetLeft < scrollLeft)
		) {
			const offsetLeft = (this.headerElementRef.nativeElement.children[this.activeIndex] as HTMLElement)?.offsetLeft
			const clientWidthElement = (this.headerElementRef?.nativeElement.children[this.activeIndex] as HTMLElement)
				.clientWidth
			let previousOffsetLeft = 0
			let nextWidthElement = clientWidthElement
			let nextOffsetLeft = offsetLeft
			let lastElement = 0
			let offsetHeader = this.headerElementRef?.nativeElement.offsetLeft

			if (this.activeIndex != 0) {
				previousOffsetLeft = (this.headerElementRef.nativeElement.children[this.activeIndex - 1] as HTMLElement)
					.offsetLeft
			}

			if (this.activeIndex != amount) {
				nextWidthElement = (this.headerElementRef.nativeElement.children[this.activeIndex + 1] as HTMLElement)
					.clientWidth
				nextOffsetLeft = (this.headerElementRef.nativeElement.children[this.activeIndex + 1] as HTMLElement).offsetLeft
				lastElement = (this.headerElementRef.nativeElement.children[amount] as HTMLElement).offsetLeft
			}

			let total = offsetLeft - previousOffsetLeft
			if (offsetLeft <= lastElement / 2) {
				this.headerElementRef.nativeElement.scrollTo({
					left: offsetLeft - offsetHeader - total - 8,
					behavior: 'smooth',
				})
			} else {
				this.scrollToNextTab(offsetLeft, offsetHeader, clientWidth, nextWidthElement, nextOffsetLeft)
			}

			if (this.allowScroll) {
				setTimeout(() => {
					this.setOverFlowTab()
				}, 1000)
			}

			this._cdr.detectChanges()
		}
		const headerEl = this.headerElementRef?.nativeElement
		const activeTabEl = headerEl?.children[this.activeIndex] as HTMLElement

		if (!headerEl || !activeTabEl) return

		requestAnimationFrame(() => {
			setTimeout(() => {
				activeTabEl.style.maxWidth = 'none'
				activeTabEl.style.flex = '0 0 auto'
				activeTabEl.style.whiteSpace = 'normal'
				activeTabEl.style.overflow = 'visible'
				activeTabEl.style.textOverflow = 'unset'
				const tabRightEdge = activeTabEl.offsetLeft + activeTabEl.scrollWidth
				const scrollTarget = tabRightEdge - headerEl.clientWidth + 16

				headerEl.scrollTo({
					left: scrollTarget,
					behavior: 'smooth',
				})
			}, 150)
		})
	}
	scrollToNextTab(
		offsetLeft: number,
		offsetHeader: number,
		clientWidth: number,
		nextWidthElement: number,
		nextOffsetLeft: number,
	) {
		let totalNext = nextOffsetLeft - offsetLeft - offsetHeader + 8
		let divide = Math.floor(offsetLeft / (clientWidth ?? 1))
		let elementPosition = totalNext + offsetLeft - clientWidth + nextWidthElement
		if (divide == 1) {
			elementPosition = Math.abs((offsetLeft % clientWidth) + nextWidthElement + totalNext)
		} else if (divide >= 2) {
			elementPosition = Math.abs((offsetLeft % clientWidth) + nextWidthElement + totalNext) + clientWidth * (divide - 1)
		}
		this.headerElementRef?.nativeElement.scrollTo({
			left: elementPosition,
			behavior: 'smooth',
		})
	}
	onChangeContent() {
		if (this.tabs && this.activeIndex <= this.tabs.length) {
			this.tab = this.tabs.get(this.activeIndex)
			setTimeout(() => {
				this.scrollToCurrentTab()
			}, 150)

			this._cdr.detectChanges()
		} else if (this.tabs && this.activeIndex > this.tabs.length) {
			this.changeTab(0)
		}
	}

	checkTabOverflow() {
		let tmpOverflow: any[] = []
		const scrollLeft = this.headerElementRef?.nativeElement.scrollLeft + this.headerElementRef?.nativeElement.offsetLeft
		const clientWidth = this.headerElementRef?.nativeElement.clientWidth
		if (this.headerElementRef?.nativeElement.children?.length) {
			Array.from(this.headerElementRef.nativeElement.children).forEach((tab, index) => {
				if (
					(tab as HTMLElement).offsetLeft < scrollLeft ||
					(tab as HTMLElement).offsetLeft + (tab as HTMLElement).clientWidth / 2 > scrollLeft + clientWidth - 36
				) {
					let tmpTab = this.tabs?.get(index) as any
					// Strip HTML tags from headerText
					const parser = new DOMParser()
					const doc = parser.parseFromString(tmpTab?.headerText ?? '', 'text/html')
					const strippedHeaderText = doc.body.textContent || ''

					tmpTab = {
						...tmpTab,
						headerText: strippedHeaderText, // Override headerText with stripped version
						value: index,
					}
					if (tmpTab) {
						tmpOverflow = [...tmpOverflow, { ...tmpTab }]
					}
				}
			})

			this.overFlowTab = [...tmpOverflow]
			this._cdr.detectChanges()
		}
	}

	selectTab(e: any) {
		this.changeTab(e.value, true)
	}

	setOverFlowTab() {
		this._setOverflow$.next(true)
	}

	setNextHeight() {
		this._setHeight$.next(true)
	}

	tabScrollEvent(e: any) {
		if (e.type == 'wheel') {
			if (this.headerElementRef && this.allowScroll && this.overFlowTab.length) {
				e.event.preventDefault()
				this.headerElementRef.nativeElement.scrollLeft += e.event.deltaY
				this.setOverFlowTab()
			}
		}
	}
	public indexPress?: number
	public timeOut?: any
	changePressIndex(e: any, index: number) {
		if (this.category === TabCategories.Tertiary) return
		if (e.type === 'mousedown') {
			this.indexPress = index
		} else {
			this.timeOut = setTimeout(() => {
				this.indexPress = -1
				clearTimeout(this.timeOut)
				this._cdr.detectChanges()
			}, 50)
		}
		this._cdr.detectChanges()
	}

	onRemoveTab(event: MouseEvent, i: number) {
		this.removeIndexChange.emit(i)
		event.stopPropagation()
	}

	formatBadgeLabel(label: string | number): string {
		const value = parseInt(label.toString(), 10)
		if (isNaN(value) || label.toString().match(/[^\d]/)) {
			return label.toString()
		}

		if (value >= 1000) {
			const formattedValue = (value / 1000).toFixed(1)
			return formattedValue.endsWith('.0') ? formattedValue.slice(0, -2) + 'K' : formattedValue + 'K'
		}

		return value.toString()
	}

	isDisabled(tabIndex: number): boolean | undefined {
		const tab = this.tabs?.get(tabIndex)

		return tab?.disabled
	}

	onMouseEnter() {
		this.hoveredTab.emit(true)
	}

	onMouseLeave() {
		this.hoveredTab.emit(false)
	}
}
