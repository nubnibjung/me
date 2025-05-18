import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { ReportLeadFollowupComponent } from './report-lead-followup.component'

describe('ReportLeadFollowupComponent', () => {
	let component: ReportLeadFollowupComponent
	let fixture: ComponentFixture<ReportLeadFollowupComponent>

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ReportLeadFollowupComponent],
			teardown: { destroyAfterEach: false },
		}).compileComponents()
	}))

	beforeEach(() => {
		fixture = TestBed.createComponent(ReportLeadFollowupComponent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
