import { User } from './../../../../shared/models/social-chat.model'
import { IReportColumn } from './../../../../shared/interfaces/report/report-column.interface'
import * as xlsx from 'xlsx'
import { ITableDataCellInterests } from '@venio/shared/interfaces/table-data-cell-interests.interface'
import {
	ChangeDetectorRef,
	Component,
	ElementRef,
	inject,
	OnDestroy,
	OnInit,
	signal,
	viewChild,
	ViewChild,
	TemplateRef,
	AfterViewInit,
	Input,
	ViewEncapsulation
} from '@angular/core'
import { Customer, CustomerInterest, Feedback, TopicInterest, vwUserInfo } from '@venio/shared/models/venio.model'
import { Summary_Column, Summary_Lead_Follow_Up } from './../../shared/report.model'
import { AppComponent } from '../../../../app.component'
import { ColumnModel } from '@venio/shared/models/datatable.model'
import { ConversationAction } from '@venio/shared/enum/conversation-action.enum'
import { ConversationAddComponent } from '@venio/modules/customer/customer-details/conversation-add/conversation-add.component'
import { ConversationQuantified } from '@venio/shared/enum/conversation-quantified.enum'
import { ConversationTypes } from '@venio/shared/enum/conversation-types.enum'
import { CustomerService } from '../../../customer/shared/customer.service'
import { CustomerState } from '@venio/shared/enum/customer-types.enum'
import { DataSharingService } from '@venio/core/data-sharing.service'
import { DateFormat, isNullOrUndefined } from '@gofive/angular-common'
import { DatePipe } from '@angular/common'
import { DependenciesInjector } from '@venio/core/dependencies-injector'
import { FieldSettingsModel, FilteringEventArgs } from '@syncfusion/ej2-dropdowns'
import { FilterSharingService } from '@venio/core/filter-sharing.service'
import { LanguageService } from '@venio/shared/services/language.service'
import { MenuEventArgs } from '@syncfusion/ej2-splitbuttons'
import { MyDropdownComponent } from '../../../shared/my-dropdown/my-dropdown.component'
import { OutcomeCall } from '@venio/shared/enum/outcome-call.enum'
import { OutcomeSms } from '@venio/shared/enum/outcome-sms.enum'
import { Permissions } from '@venio/shared/enum/permissions.enum'
import { PlanAddComponent } from '@venio/modules/plan/plan-add/plan-add.component'
import { ReportFilter } from '@venio/modules/dashboard/shared/report.model'
import { ReportService } from '@venio/modules/dashboard/shared/report.service'
import { Router } from '@angular/router'
import { SearchFilter, StaffFilter } from '@venio/modules/admin/shared/team.model'
import { Statuses } from '@venio/shared/enum/statuses.enum'
import {
	debounceTime,
	distinctUntilChanged,
	filter,
	firstValueFrom,
	Observable,
	Subject,
	Subscription,
	switchMap,
	takeUntil
} from 'rxjs'

import { TAB_CUSTOMER_INSIGTH } from './../report-customer-insight.component'
import { TeamService } from '@venio/modules/admin/shared/team.service'
import { TypeCaseEditUrgent } from '@venio/shared/enum/type-case-edit-urgent.enum'
import { getDate } from '@venio/shared/helper/dateTime'
import { AppConfig } from '@venio/shared/classes/config'
import { ReportPDFService } from '@venio/shared/services/report-pdf.service'
import { conversationActionIdToKey } from '@venio/shared/constansts'
import { DropdownEventArgs, FilterDataSource } from '@gofive/design-system-dropdown'
import { ExportFileType } from '@venio/shared/enum/export-file-type.enum'
import { HistoryLogComponent } from '../../shared/history-log/history-log.component'
import { DateRangeModel } from '@gofive/design-system-calendar/lib/models/datepicker.model'
import { Go5DropdownFilterEventArgs } from '@venio/shared/interfaces/dropdown.interface'
import {
	Go5TableStandardColumn,
	Go5TableStandardColumnType,
	IGo5TableStandardSortEvent,
	OptionColumnModel
} from '@gofive/design-system-table'
import { GoogleTagManagerService } from 'angular-google-tag-manager'
import { InformationProfile } from '@venio/modules/home/shared/home.model'
import { ids } from 'webpack'

@Component({
	selector: 'app-report-lead-followup',
	templateUrl: './report-lead-followup.component.html',
	styleUrls: ['./report-lead-followup.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class ReportLeadFollowupComponent implements OnInit, OnDestroy, AfterViewInit {
	private readonly reportPDFService = inject(ReportPDFService)
	public currentUser: vwUserInfo = new vwUserInfo()
	public canExportReport: boolean = false
	public data: InformationProfile
	public Reportdata: any[] = []
	public filter: ReportFilter = new ReportFilter()
	public loading = true
	@ViewChild('export')
	public tbDataExport: ElementRef
	public columnsFields: FieldSettingsModel = { text: 'columnName', value: 'columnId' }
	public dataExport: Object[] = []
	@Input() currentUser$: Observable<vwUserInfo>
	
	private previousAvatarUrl: string

	private readonly interestBody = viewChild<TemplateRef<HTMLTableCellElement>>('interestBody')
	private readonly customBody = viewChild<TemplateRef<HTMLTableCellElement>>('customBody')
	private readonly ownerBody = viewChild<TemplateRef<HTMLTableCellElement>>('ownerBody')
	private readonly dateConBody = viewChild<TemplateRef<HTMLTableCellElement>>('dateConBody')
	private readonly actionBody = viewChild<TemplateRef<HTMLTableCellElement>>('actionBody')

	@Input() values!: ITableDataCellInterests[]
	public allColumns: Go5TableStandardColumn[] = []
	public columns: Go5TableStandardColumn[] = []
	ngAfterViewInit(): void {
		this.columns = [
			{
				id: 'customerName',
				width: '220px',
				minWidth: '220px',
				header: {
					text: 'common_report_customer_name',
					align: 'start'
				},
				sortable: true,
				type: Go5TableStandardColumnType.Custom,
				bodyTemplate: this.customBody()
			},
			{
				id: 'userFullname',
				width: '250px',
				minWidth: '250px',
				header: {
					text: 'common_customer_owner',
					align: 'start'
				},
				sortable: true,
				type: Go5TableStandardColumnType.Custom,
			 bodyTemplate: this.ownerBody()
			},

			{
				id: 'customerInterests',
				width: '240px',
				maxWidth: '240px',
				header: {
					text: 'common_report_interested_in',
					align: 'start'
				},
				type: Go5TableStandardColumnType.Custom,
				bodyTemplate: this.interestBody()
			},
			{
				id: 'sourceOfLeadName',
				width: '200px',
				minWidth: '200px',
				header: {
					text: 'common_customer_source_of_lead',
					align: 'start'
				},
				sortable: true,
				type: Go5TableStandardColumnType.Text,
				topic: { fieldName: 'sourceOfLeadName' }
			},
			{
				id: 'dateCreatedCustomer',
				width: '180px',
				minWidth: '180px',
				header: {
					text: 'common_report_created_date',
					align: 'start'
				},
				sortable: true,
				type: Go5TableStandardColumnType.Text,
				topic: { fieldName: 'dateCreatedCustomer' }
			},
			{
				id: 'dateConversation',
				width: '190px',
				minWidth: '190px',
				header: {
					text: 'common_report_last_conversation',
					align: 'start'
				},
				sortable: true,
				type: Go5TableStandardColumnType.Custom,
				bodyTemplate: this.dateConBody()
			},
			{
				id: 'dateFollowUp',
				width: '240px',
				minWidth: '240px',
				header: {
					text: 'common_customer_next_action',
					align: 'start'
				},
				sortable: true,
				type: Go5TableStandardColumnType.Text,
				topic: { fieldName: 'dateFollowUp' }
			},

			{
				id: 'customerId',
				width: '240px',
				minWidth: '240px',
				header: {
					text: 'common_report_action',
					align: 'start'
				},
				sortable: true,
				type: Go5TableStandardColumnType.Custom,
				bodyTemplate: this.actionBody()
			}
		]
		if (this.filter?.column?.length) {
  this.setActiveColumns(this.filter.column);
} else {
  this.setDefaultColumn();
}
		this.allColumns = [...this.columns];
			const mappedColumns = this.columns.map((col) => ({
  columnId: col.id,
  columnName: col.header?.text
}));
this.setDataSourceFilter('column', mappedColumns);
this.columnsFields = { text: 'columnName', value: 'columnId' };

// ถ้ายังไม่มี filter column -> set default column เป็นทั้งหมด
if (!this.filter.column || this.filter.column.length === 0) {
  this.filter.column = this.columns.map(col => col.id as any); 
}
		if (this.columns?.length > 0 && (!this.Reportdata || this.Reportdata.length === 0) && !this.loading) {
			this.getData()
		}
	}

	sendMixPanelEvent(eventKey: string) {
		this._gtmService.pushTag({ event: eventKey })
	}

	public summary: Summary_Lead_Follow_Up = null
	public loadingSummary = true
	public summaryColumm: Summary_Column[] = [
		{ column: 'totalCustomer', unit: 'report_lead_followup_total_customer', type: 'number', line: false },
		{ column: 'lead', unit: 'common_customer_lead', type: 'number', line: true },
		{ column: 'prospect', unit: 'common_customer_prospect', type: 'number', line: false },
		{ column: 'customer', unit: 'common_customer_customer', type: 'number', line: false },
		{ column: 'business', unit: 'common_customer_business', type: 'icon', line: true, icon: 'business' },
		{ column: 'individual', unit: 'common_customer_individual', type: 'icon', line: false, icon: 'individual' },
		{
			column: 'totalUnAssigned',
			unit: 'report_lead_followup_total_unassigned',
			type: 'number',
			line: true,
			color: 'text-secondary'
		},
		{ column: 'notRecentlyContacted', unit: 'report_lead_followup_not_recently', type: 'number', line: false }
	]
	@ViewChild('staff')
	public staffDdl: MyDropdownComponent
	@ViewChild('dialog')
	dialog: HistoryLogComponent
	public staffs: Object[] = []
	public stfFields: Object = { text: 'fullName', value: 'userId', picture: 'pictureUrl', detail: 'positionName' }
	public teams: Object[] = []
	public teamFields: Object = { text: 'teamName', value: 'teamId' }
	public customers: Customer[] = []
	public products: TopicInterest[] = []
	public productsFields: Object = { text: 'topicName', value: 'topicId' }
	public source: any[] = []
	public sourceOfLead: Object = { text: 'typeName', value: 'typeId' }
	public socialAccounts = []

	public customerFields: Object = {
		text: 'customerName',
		value: 'customerId',
		picture: 'pictureUrl',
		status: 'customerStateDisplay'
	}
	public customerFilterFields: string[] = ['customerName', 'customerCode']
	public customerId = 0
	public case: Feedback
	public conversationTypes: { [key: string]: Object }[] = [
		{ text: 'CONVERSATION.typeName-Call', value: ConversationTypes.Call },
		{ text: 'CONVERSATION.typeName-Email', value: ConversationTypes.Email },
		{ text: 'CONVERSATION.typeName-SMS', value: ConversationTypes.SMS },
		{ text: 'CONVERSATION.typeName-Social', value: ConversationTypes.Social },
		{ text: 'CONVERSATION.typeName-Other', value: ConversationTypes.Other }
	]
	public socialMediaData: any[] = [
		{ iconCss: 'fa fa-phone color-primary', text: 'Call', key: 'telephone', isActive: true },
		{ iconCss: 'fa fa-envelope color-primary', text: 'E-mail', key: 'email', isActive: true },
		{ iconCss: 'Icon-social-facebook', iconPath: 2, text: 'Facebook', key: 'facebook', isActive: true },
		{ iconCss: 'Icon-social-line', iconPath: 6, text: 'Line', key: 'line', isActive: true },
		// { class: 'icon icon-social-twitter', iconPath: 2, socialMedia: 'Twitter', key: 'twitter', isActive: true },
		{ iconCss: 'Icon-social-whatsapp', iconPath: 2, text: 'WhatsApp', key: 'whatsapp', isActive: true },
		{ iconCss: 'Icon-social-skype', iconPath: 2, text: 'Skype', key: 'skype', isActive: true },
		{ iconCss: 'Icon-social-instagram', iconPath: 4, text: 'Instagram', key: 'instagram', isActive: true },
		{ iconCss: 'Icon-social-linkedin', iconPath: 4, text: 'Linkedin', key: 'linkedin', isActive: true },
		{ iconCss: 'Icon-social-telegram', iconPath: 4, text: 'Telegram', key: 'telegram', isActive: true },
		{ iconCss: 'Icon-social-wechat', iconPath: 3, text: 'Wechat', key: 'wechat', isActive: true }
	]
	public iconFields: Object = { text: 'text', iconCss: 'iconCss', value: 'key' }
	public typesFields: Object = { text: 'text', value: 'value' }
	@ViewChild('addConversation')
	addConversation: ConversationAddComponent
	@ViewChild('createPlanTab')
	public createPlanTab: PlanAddComponent
	public btnExoprt = false
	public btnExport = false
	public filterExport: ReportFilter = new ReportFilter()
	private teamsSubscribe$: Subscription
	private staffSubscribe$: Subscription
	private customerSubscribe$: Subscription
	private OMSubscribe$: Subscription
	private dataSubscription$: Subscription
	private currentFilterSubscription$: Subscription
	private currentDateFilterSubscription$: Subscription
	private summaryObserver$: Subscription
	private scrollHeight = 0
	public dataSourceFilter: FilterDataSource[] = [
		{
			text: 'common_report_filter_column',
			value: 'column',
			allowFiltering: false,
			fields: this.columnsFields,
			dataSource: this.allColumns.map(col => ({ columnId: col.id, columnName: col.header?.text }))
		},
		{
			text: 'common_customer_source_of_lead',
			value: 'sourceOfLead',
			fields: this.sourceOfLead,
			allowFiltering: true,
			dataSource: []
		},
		{
			text: 'common_report_interested_in',
			value: 'products',
			fields: this.productsFields,
			allowFiltering: true,
			dataSource: []
		},
		{
			text: 'common_customer',
			value: 'customerIds',
			fields: this.customerFields,
			allowFiltering: true,
			dataSource: []
		},
		{
			text: 'common_team',
			value: 'teamIds',
			fields: this.teamFields,
			allowFiltering: true,
			dataSource: []
		},
		{
			text: 'common_staff',
			value: 'userIds',
			fields: this.stfFields,
			allowFiltering: true,
			dataSource: []
		}
	]

	private readonly destroy$ = new Subject<void>()
	private searchSubject = new Subject<FilteringEventArgs>()
	private readonly debounceTimeMs = 300
	public scrollLoading = signal(false)
	private contentScrollElement: HTMLElement
	public firstSettingColumn = true
	public defaultColumns: number[] = []
	public typeExportFile: ExportFileType = ExportFileType.LeadFollowup
	public date: Date = new Date()
	public dateRang: DateRangeModel = {
		dateFrom: new Date(this.date.getFullYear(), this.date.getMonth(), 1),
		dateTo: new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0)
	}

	constructor(
		public app: AppComponent,
		private _gtmService: GoogleTagManagerService,
		public dataShare: DataSharingService,
		private filterSharingService: FilterSharingService,
		private teamService: TeamService,
		private customerService: CustomerService,
		public reportService: ReportService,
		public router: Router,
		private datePipe: DatePipe,
		public languageService: LanguageService,
		public _cdr: ChangeDetectorRef,
		private cdr: ChangeDetectorRef

	) {
		this.currentUser = DependenciesInjector.getCurrentUser()
		if (this.currentUser) {
			if (this.currentUser.permissions.indexOf(Permissions.Reports_Export) > 1) {
				this.canExportReport = true
			}
		}
		this.currentFilterSubscription$ = this.filterSharingService.filterLeadFollowupReport.subscribe((res) => {
			this.filter = res
			if (res.column?.length) {
				this.setActiveColumns(res.column)
			} else {
				this.setDefaultColumn()
			}
			this.scrollHeight = 0
			this.reloadData()
		})
	}

	get DateFormat() {
		return DateFormat
	}

	get Statuses() {
		return Statuses
	}

	get ConversationTypes() {
		return ConversationTypes
	}

	get CustomerTypes() {
		return CustomerState
	}

	get ConversationAction() {
		return ConversationAction
	}

	get OutcomeCall() {
		return OutcomeCall
	}

	get OutcomeSms() {
		return OutcomeSms
	}

	get ConversationQuantified() {
		return ConversationQuantified
	}

	get CurrentAppLanguage() {
		return this.languageService.GetCurrenAppLanguage()
	}

	public onSubmitConversation(createPlan: any) {
		this.customers = []
		if (createPlan.isCreate) {
			this.createPlanTab.openClick(this.customerId)
		}
	}

	createConversation(customerId) {
		this.customerId = customerId
		this.addConversation.openClick(customerId)
	}

	public createPlan(customerId) {
		this.createPlanTab.openClick(customerId)
	}

	public relateActivity(e: number) {
		const model: Feedback = new Feedback()
		model.feedbackId = this.case.feedbackId
		const ids: number[] = (this.case.relatedActivities || []).map((s) => s.activityId)
		ids.push(e)
		model.activityIds = ids
		model.type = TypeCaseEditUrgent.EditFeedbackActivity
	}

	counter(value) {
		return new Array(value)
	}

	async ngOnInit(): Promise<void> {
		this.getInterested()
		this.getSource()
		this.getTeamsList()
		this.getStaffList()
		this.loadSetting()
		
		this.customers = await this.getCustomersList()
		this.contentScrollElement = document.querySelector('.dashboard-report-page .content')
		if (this.contentScrollElement) {
			this.onScroll = this.onScroll.bind(this)
			this.contentScrollElement.addEventListener('scroll', this.onScroll)
		}

		this.searchSubject
			.pipe(
				takeUntil(this.destroy$),
				debounceTime(this.debounceTimeMs),
				distinctUntilChanged(),
				filter(({ text }) => text === '' || text?.length >= 3),
				switchMap(($event) => {
					return this.processInput($event)
				})
			)
			.subscribe(({ res, event }) => {
				event.updateData(res as any)
			})
	}

	ngOnDestroy() {
		this.destroy$.next()
		this.destroy$.complete()

		this.teamsSubscribe$?.unsubscribe()
		this.staffSubscribe$?.unsubscribe()
		this.customerSubscribe$?.unsubscribe()
		this.OMSubscribe$?.unsubscribe()
		this.dataSubscription$?.unsubscribe()
		this.currentFilterSubscription$?.unsubscribe()
		this.currentDateFilterSubscription$?.unsubscribe()
		this.summaryObserver$?.unsubscribe()
		if (this.contentScrollElement) {
			this.contentScrollElement.removeEventListener('scroll', this.onScroll)
		}
	}

	private processInput(event: FilteringEventArgs): Promise<{
		res: Customer[]
		event: FilteringEventArgs
	}> {
		return new Promise(async (resolve) => {
			const res = await this.getCustomersList(event?.text ?? '')
			resolve({ res, event })
		})
	}

	public loadSetting() {
		this.currentDateFilterSubscription$ = this.dataShare.currentSearchReportFilter.subscribe(
			(s) => {
				if (s.tabId === TAB_CUSTOMER_INSIGTH.LeadFollowup) {
					this.filter.dateFrom = getDate(s.dateFrom)
					this.filter.dateTo = getDate(s.dateTo)
					this.filter.orderBy = 'dateCreatedCustomer desc'
					this.filter.pageLength = 100
					this.filterSharingService.setFilterLeadFollowupReport(this.filter)
				}
			},
			(err: any) => {
				const maxDate = new Date()
				const dateRang = { start: new Date(maxDate.getFullYear(), maxDate.getMonth(), 1), end: maxDate }
				this.filter.dateFrom = isNullOrUndefined(dateRang) ? dateRang!.start : dateRang.start
				this.filter.dateTo = isNullOrUndefined(dateRang) ? dateRang!.end : dateRang.end
				this.filter.orderBy = 'dateCreatedCustomer desc'
				this.filter.tabId = TAB_CUSTOMER_INSIGTH.LeadFollowup
				this.dataShare.setSearchReportFilter(this.filter)
			}
		)
	}

getData(pageLength = 40) {
  this.loading = true;
  this.Reportdata = [];
  this.filter.start = this.Reportdata?.length || 0;
  this.filter.pageLength = pageLength;

  // Unsubscribe previous subscription
  this.dataSubscription$?.unsubscribe();
  
  // Make the API call
  this.dataSubscription$ = this.reportService.LeadFollowupReport(this.filter).subscribe(
    (res) => {
      console.log('API raw result:', res);

      // Map the response data
      const mappedData = res.map((item) => {
        
		const userFullname = item.userFullname
          ? item.userFullname.split(',').map(name => name.trim()) // แยก string ที่คั่นด้วย comma
          : [];
        const pictureUrl = item.ownerInfo?.map(o => o?.pictureUrl) || [];

		const ownerInfoMapped = item.ownerInfo?.slice(0, 4).map(o => ({
          pictureUrl: o?.pictureUrl ?? '',
          userFullname: o?.userFullname ?? ''
        }));

        // Check if there are more than 4 owners and add the count for the remaining ones
        if (item.ownerInfo?.length > 4) {
          const remainingCount = item.ownerInfo.length - 4;
          ownerInfoMapped.push({
            userFullname: `+${remainingCount}`,
            pictureUrl: 'your_placeholder_image_url'  // Set a placeholder image
          });
        }

        return {
          customerName: item.customerName,
          userFullname: item.userFullname,
          ownerInfo: ownerInfoMapped,
		//   userFullname: userFullname, // เก็บ userFullname เป็น array
        //   pictureUrl: pictureUrl, // เก็บ pictureUrl เป็น array
          customerInterests: item.customerInterests?.map((i) => i.topicName),
          customerId: item.customerId,
          telephone: item.telephone,
          UserPictureUrl: item.UserPictureUrl,
          positionName: item.positionName,
          userId: item.userId,
          email: item.email,
          sourceOfLeadName: item.sourceOfLeadName,
          dateCreatedCustomer: item.dateCreatedCustomer
            ? this.datePipe.transform(item.dateCreatedCustomer, 'dd/MM/yyyy HH:mm')
            : '',
          dateConversation: item.dateConversation ? item.dateConversation : '',
          dateFollowUp: item.dateFollowUp
            ? this.datePipe.transform(item.dateFollowUp, 'EEE, dd MMMM yyyy HH:mm', undefined, 'en-US')
            : '',
          dateLatestPlanned: item.dateLatestPlanned
            ? this.datePipe.transform(item.dateLatestPlanned, 'EEE, dd MMMM yyyy HH:mm', undefined, 'en-US')
            : ''
        };
      });

      console.log('Mapped Data:', mappedData);

      // Concatenate new data to the existing data
      this.Reportdata = this.Reportdata.concat(mappedData);
      this.loading = false;
      this.scrollLoading.set(false);
      this.dataSubscription$?.unsubscribe();
      this.dataSubscription$ = null;
      this._cdr.detectChanges();
    },
    (err) => {
      this.Reportdata = [];
      this.loading = false;
      this.scrollLoading.set(false);
      this._cdr.detectChanges();
    }
  );
}


	public itemBeforeEvent(args: MenuEventArgs, item) {
		if (args.item.id === 'telephone' || args.item.id === 'email') {
			args.element.innerHTML = `<a class="color-primary" style="color: #116DFC;text-decoration: none;">${args.item.text}</a>`
			const anchor: Element = args.element?.children[0]
			anchor.setAttribute('href', args.item.url)
			anchor.textContent = args.item.text
		} else {
			args.element.innerHTML =
				'<img class="img-social" style="width:45px;height:20px;margin-right:-3px;"><a id="socialText" class="color-primary" style="color: #116DFC;text-decoration: none;">Facebook</a>'
			const img: Element = args.element?.children[0]
			img.setAttribute('src', 'assets/icon/icons-svg/' + args.item.iconCss + '.svg')
			const link: Element = args.element?.children[1]
			link.setAttribute('href', args.item.url)
			link.textContent = `${args.item.text}: ${item[args.item.id]} `
		}
		args.element.getElementsByTagName('a')[0].setAttribute('target', '_blank')
	}

	async showSocial(item) {
		this.socialAccounts = this.socialMediaData
			.filter((s) => item[s.key]) // Ensure there's a corresponding item value
			.map((s) => {
				const baseTexts = {
					telephone: 'Call: ',
					email: 'E-mail: '
				}
				const baseUrls = {
					telephone: `tel://${item[s.key]}`,
					email: `mailto:${item[s.key]}`,
					facebook: `https://www.facebook.com/${item[s.key]}`,
					line: `https://line.me/ti/p/~${item[s.key]}`,
					whatsapp: `whatsapp://${item[s.key]}`,
					skype: `skype:${item[s.key]}?call`,
					instagram: `https://www.instagram.com/${item[s.key]}`,
					linkedin: `https://ca.linkedin.com/in/${item[s.key]}`,
					telegram: `https://telegram.me/share/url?url=${item[s.key]}`,
					wechat: `weixin://dl/chat?${item[s.key]}`
				}

				// Update text if it's telephone or email.
				if (s.key in baseTexts) {
					s.text = `${baseTexts[s.key]}${item[s.key]} `
				}

				// Set URL based on the key.
				s.url = baseUrls[s.key] || ''
				s.id = s.key

				return s
			})
	}

	public reloadData() {
		this.scrollHeight = 0
		this.Reportdata = []
		this.getData()
		this.getDataSummary()
	}

	public onSearch(key: string, value: any[]) {
		this.filter[key] = value?.length > 0 ? value : null
		this.filterSharingService.setFilterLeadFollowupReport(this.filter)
	}
	
private preferredOrder: string[] = [
  'customerName',
  'userFullname',
  'customerInterests',
  'sourceOfLeadName',
  'dateCreatedCustomer',
  'dateConversation',
  'dateFollowUp'
];
public onSelectedFilter(event: DropdownEventArgs) {
  const type: string = event?.data?.value;

  if (type === 'column') {
    const selectedItems = event?.selectedItems ?? event?.value ?? [];
    const selectedIds = selectedItems.map(item => {
      return typeof item === 'object' && 'columnId' in item
        ? item.columnId.toString()
        : item.toString();
    });

    console.log('Selected IDs:', selectedIds);

    // ✅ ใช้ preferredOrder เพื่อเรียงเฉพาะที่ผู้ใช้เลือกไว้
    const finalSortedIds = this.preferredOrder.filter(preferredId =>
      selectedIds.includes(preferredId)
    );

    this.columns = finalSortedIds.map(id =>
      this.allColumns.find(col => col.id.toString() === id)
    ).filter(Boolean);

    console.log('Final columns:', this.columns.map(col => col?.id));

    this.filter.column = selectedIds;
    this.filterSharingService.setFilterLeadFollowupReport(this.filter);

    this.Reportdata = [];
    this.getData();
    return;
  }

  if (type === 'teamIds') {
    this.filter.userIds = [];
    this.getStaffList(this.filter.teamIds?.length ? this.filter.teamIds : null);
  }

  const ids = [...new Set(event?.value)];
  this.filter[type] = ids;
  this.filterSharingService.setFilterLeadFollowupReport(this.filter);
}


	public openCustomer(id: number) {
		this.app.openCustomerURL(id)
	}

	public openEmp(userId: string) {
		this.router.navigateByUrl('/employee/' + userId)
	}

	public onSelectedTeams(e) {
		this.filter.teamIds = e?.length > 0 ? e : null
		this.getStaffList(this.filter.teamIds)
		this.filter.userIds = null
		this.staffDdl.myDdl.value = null
		this.reloadData()
	}

	public onScroll(e) {
		const element: HTMLElement = e.target
		if (
			this.scrollHeight < element?.scrollHeight &&
			element?.offsetHeight + element?.scrollTop + 300 > element?.scrollHeight
		) {
			this.scrollLoading.set(true)
			this.scrollHeight = element?.scrollHeight
			this.getData()
		}
	}

	// public sortingBy(event, col: ColumnModel) {
	// 	if (col.orderable) {
	// 		this.columns?.forEach((column) => {
	// 			if (column.column === col.column) {
	// 				column['sortType'] = event.orderBy || 'asc'
	// 			} else {
	// 				column['sortType'] = null
	// 			}
	// 			return column
	// 		})

	// 		this.filter.orderBy = `${event.key} ${event.orderBy?.toLowerCase() || 'asc'}`
	// 		this.reloadData()
	// 	}
	// }
	

	public getInterested() {
		this.customerService
			.GetTopicInterest()
			.toPromise()
			.then((res) => {
				this.products = res
				this.setDataSourceFilter('products', res)
			})
	}

	public getSource() {
		this.customerService
			.GetSourceOfLead()
			.toPromise()
			.then((res) => {
				this.source = res.data
				this.setDataSourceFilter('sourceOfLead', res.data)
			})
	}

	getAllData() {
		const filter = this.filter
		filter.start = 0
		filter.pageLength = 2000
		this.dataExport = []
		firstValueFrom(this.reportService.LeadFollowupReport(filter)).then((res) => {
			this.dataExport = res
			this.btnExoprt = true
		})
	}

	exportToExcel() {
		if (this.btnExoprt) {
			this.btnExoprt = false
			const wb: xlsx.WorkBook = xlsx.utils.book_new()
			const ws: xlsx.WorkSheet = xlsx.utils.table_to_sheet(this.tbDataExport?.nativeElement, {
				cellStyles: true,
				display: false
			})
			xlsx.utils.book_append_sheet(wb, ws, 'Sheet1')
			const date = 'yyyy-MM-d'
			const nameFile =
				'LeadFollowup_Report' +
				this.datePipe.transform(this.filter.dateFrom, date) +
				'_to_' +
				this.datePipe.transform(this.filter.dateTo, date) +
				'.xlsx'
			xlsx.writeFile(wb, nameFile)
		}
	}

	public async exportData() {
		this.btnExport = true

	const exportColumns: IReportColumn[] = this.filter.column.map(colId => {
	const col = this.allColumns.find(c => c.id.toString() === colId.toString());
	return {
		column: colId.toString(),
		columnName: col?.header?.text ?? '',
		isActive: true
	};
});

		let objectExport = null
		this.reportPDFService.exportReport(exportColumns).then((val) => {
			objectExport = val
			this.filterExport = JSON.parse(JSON.stringify(this.filter))
			this.filterExport.start = 0
			this.filterExport.pageLength = 10000
			this.filterExport.orderColumns = objectExport.orderColumns

			this.reportService.ExportReportLeadFollowup(this.filterExport).subscribe(
				(res) => {
					this.reportService.downloadFile(res.body, res.headers)
					this.btnExport = false
				},
				(error) => {
					AppConfig.OPEN_FN.next({ key: 'dialog', value: { httpStatusCode: error?.status } })
				}
			)
		})
	}

	private getDataSummary() {
		this.loadingSummary = true
		this.summary = new Summary_Lead_Follow_Up()
		this.summaryObserver$?.unsubscribe()
		this.summaryObserver$ = this.reportService.SummaryConversationReport(this.filter).subscribe(
			(res) => {
				this.summary = res
				this.loadingSummary = false
				this.summaryObserver$?.unsubscribe()
				this.summaryObserver$?.remove(this.summaryObserver$)
				this.summaryObserver$ = null
			},
			(error) => {
				console.log(error)
				this.loadingSummary = false
				AppConfig.OPEN_FN.next({ key: 'dialog', value: { httpStatusCode: error?.status } })
			}
		)
	}

	private getTeamsList() {
		this.teamsSubscribe$ = this.teamService.GetDdlTeam().subscribe({
			next: (res) => {
				this.teams = res
				this.setDataSourceFilter('teamIds', res)
				AppConfig.OPEN_FN.next({ key: 'dialog', value: { httpStatusCode: res?.httpStatusCode } })
			},
			error: () => {
				this.teams = []
				this.setDataSourceFilter('teamIds', [])
			}
		})
	}

	private getStaffList(teamIds: number[] = null) {
		this.staffSubscribe$?.unsubscribe()

		const model: StaffFilter = new StaffFilter()
		model.teamIds = teamIds
		model.take = 100
		model.skip = 0
		model.type = Permissions.Customer
		model.companyIds = this.filter.companyIds || []
		this.staffs = []
		this.staffSubscribe$ = this.teamService.GetFilterStaff(model).subscribe(
			(res) => {
				this.staffs = res.data
				this.setDataSourceFilter('userIds', res.data)
				this.staffSubscribe$?.unsubscribe()
				this.staffSubscribe$?.remove(this.staffSubscribe$)
				this.staffSubscribe$ = null
			},
			(err) => {
				console.log(err)
				this.setDataSourceFilter('userIds', [])
				AppConfig.OPEN_FN.next({ key: 'dialog', value: { httpStatusCode: err?.status } })
			}
		)
	}

	private async getCustomersList(text = ''): Promise<Customer[]> {
		try {
			const res = await this.customerService.GetSearchCustomer({
				search: text,
				take: 10000
			})
			this.setDataSourceFilter('customerIds', res)
			return res
		} catch (error: unknown) {
			this.customers = []
			this.setDataSourceFilter('customerIds', [])
			console.log(error)
			if (typeof error === 'object' && 'status' in error && typeof error?.status === 'number') {
				AppConfig.OPEN_FN.next({ key: 'dialog', value: { httpStatusCode: error?.status } })
			}
		}
	}

	async onCustomerFiltering($event?: FilteringEventArgs): Promise<void> {
		this.searchSubject.next($event)
	}

	getConversationActionKey(actionId: number) {
		return actionId in conversationActionIdToKey ? conversationActionIdToKey[actionId] : ''
	}

	private setDataSourceFilter(key: string, data: any[]) {
		const filter = this.dataSourceFilter.find((f) => f.value === key)
		if (filter) {
			filter.dataSource = data
		}
		this.dataSourceFilter = [...this.dataSourceFilter]
	}

	public setDefaultColumn() {
  if (this.firstSettingColumn) {
	this.filter.column = this.columns.map(col => Number(col.id)); // default: ทุก column
    this.setActiveColumns(this.filter.column);
    this.setDataSourceFilter('column', this.columns);
  }

  if (this.filter?.column?.length) {
    this.setActiveColumns(this.filter?.column);
  }

  this.firstSettingColumn = false;
}

setActiveColumns(columnsIds: (string | number)[] = []) {
	const ids = columnsIds.map(id => id.toString());

	this.columns = ids.map(id =>
		this.allColumns.find(col => col.id.toString() === id)
	).filter(Boolean);
}
	public onClearAll(event) {
  this.setActiveColumns([]); // ล้าง columns
  this.columns = []; // ให้ table หายไปทั้งหมด

  this.dataSourceFilter.forEach((filter) => {
    const key = filter.value;
    this.filter[key] = [];
  });

  this.getDataSummary();
  this.getData();
}

	public openHistoryLog() {
		this.dialog?.openDialog(this.typeExportFile)
	}

	public setFilter(date: ReportFilter) {
		this.filter.dateFrom = new Date(date.dateFrom)
		this.filter.dateTo = new Date(date.dateTo)
		this.filter.orderBy = 'dateCreatedCustomer desc'
		this.filter.interval = date.interval
		this.filterSharingService.setFilterLeadFollowupReport(this.filter)
	}

	public onFiltering($event: Go5DropdownFilterEventArgs): void {
		const filterType = $event?.value
		const searchText = $event?.text ?? ''
		if (filterType === 'customerIds') {
			this.customerService
				.GetSearchCustomer({
					search: searchText
				})
				.then((res) => {
					this.customers = res

					if ($event.updateData) {
						$event.updateData(res)
					}
				})
				.catch((error) => {
					console.log(error)
					this.customers = []

					if ($event.updateData) {
						$event.updateData([])
					}
				})
		}

		if (filterType === 'userIds') {
			this.teamService
				.GetFilterStaff({
					search: searchText,
					teamIds: this.filter.teamIds,
					skip: 0,
					take: 10000,
					type: Permissions.Customer,
					companyIds: this.filter.companyIds
				})
				.subscribe((res) => {
					this.staffs = res.data

					if ($event.updateData) {
						$event.updateData(res.data)
					}
				})
		}
	}
	convertToInterestsCell(value: string[]): ITableDataCellInterests[] {
		

		if (!Array.isArray(value)) {
			return []
		}

		const result = value.map((interest) => {
			return {
				topicName: interest
			}
		})
		
		return result
	}
convertToOwnerInfoCell(ownerInfo: any[]): { pictureUrl: string, userFullname: string }[] {
  if (!Array.isArray(ownerInfo)) {
    return [];
  }

  const result = ownerInfo.slice(0, 4).map(o => ({
    pictureUrl: o?.pictureUrl ?? '',
    userFullname: o?.userFullname ?? ''
  }));

  if (ownerInfo.length > 4) {
    const remainingCount = ownerInfo.length - 4;

    result.push({
      userFullname: `+${remainingCount}`,  
      pictureUrl: '',                     
                         
    });
  }

  return result;
}
private getSortField(id: string): string {
		const map = {
			customerName: 'customerName',
			userFullname: 'userFullname',
			customerInterests: 'customerInterests',
			sourceOfLeadName: 'sourceOfLeadName',
			dateCreatedCustomer: 'dateCreatedCustomer',
			dateConversation: 'dateConversation',
			dateFollowUp: 'dateFollowUp'
		}
		return map[id] || id
	}

	sortingBy(event: IGo5TableStandardSortEvent) {
		const sortField = this.getSortField(event.id)
		this.filter.orderBy = `${sortField} ${event.sortOrder}`
		this.Reportdata = []
		this.filter.start = 0
		this.filterSharingService.setFilterLeadFollowupReport(this.filter)
		this.getData()
	}
}