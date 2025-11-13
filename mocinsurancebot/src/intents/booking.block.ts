import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';

import { AgentCalendarService } from '../agentCalendar/agentCalendar.service';
import { gliaConfig } from '../config/constants';
import { FulfillmentContext } from '../fulfillment/fulfillment.context';
import { DialogFlowIntent } from '../fulfillment/fulfillment.decorator';
import { DialogFlowFulfillmentResponse } from '../fulfillment/interfaces';
import { GliaApiService } from '../gliaApi/gliaApi.service';
import { OutlookCalendarApiService } from '../outlookCalendarApi/outlookCalendarApi.service';

@Injectable()
export class BookAppointmentBlock {
  private OUTLOOK_USER_ID: string;
  private AGENT_TIME_ZONE: string;
  constructor(
    private configService: ConfigService,
    private gliaApiService: GliaApiService,
    private agentCalendarService: AgentCalendarService,
    private outlookCalendarApiService: OutlookCalendarApiService,
  ) {
    this.OUTLOOK_USER_ID = this.configService.get<string>('OUTLOOK_USER_ID');
    this.AGENT_TIME_ZONE = this.configService.get<string>('AGENT_TIME_ZONE');
  }

  @DialogFlowIntent('test')
  async test(
    context: FulfillmentContext,
  ): Promise<DialogFlowFulfillmentResponse> {
    return {
      fulfillmentMessages: [context.createFulfillmentMessage('test')],
    };
  }
  @DialogFlowIntent('0.5-booking-choose-agent')
  async chooseAgent(
    context: FulfillmentContext,
  ): Promise<DialogFlowFulfillmentResponse> {
    const agents = await this.gliaApiService.fetchAgents();
    return {
      fulfillmentMessages: [
        context.createFulfillmentMessage(
          '<h4>Please choose an agent for Booking an Appointment:</h4>' +
            agents.reduce((prevVal, anAgent) => {
              return (prevVal += `<div style="margin-top: 5px;display: flex;align-items: center"><img src="${
                anAgent.icon || gliaConfig.defaultAgentImage
              }" style="width:20px;height:20px;">
            <span style="margin-left: 5px">${anAgent.name}</span></div>`);
            }, ''),
        ),
        context.createSuggestionFulfillmentMessage(
          'Please choose an agent',
          agents.map((anAgent) => {
            return {
              text: anAgent.name,
              value: `agent-${anAgent.id}`,
            };
          }),
        ),
      ],
    };
  }

  @DialogFlowIntent('0.5-booking-choose-day')
  async chooseDay(
    context: FulfillmentContext,
  ): Promise<DialogFlowFulfillmentResponse> {
    const agent = context.dialogFlowResponse.queryResult.parameters.agent;

    const events = await this.outlookCalendarApiService.fetchEvents(
      this.OUTLOOK_USER_ID,
      this.AGENT_TIME_ZONE,
    );
    const days = this.agentCalendarService.getDaysWithFreeSlots(
      events,
      this.AGENT_TIME_ZONE,
    );
    return {
      fulfillmentMessages: [
        context.createSuggestionFulfillmentMessage(
          'Please choose a day',
          days.map((aDay) => {
            return {
              text: aDay,
              value: aDay,
            };
          }),
        ),
      ],
      outputContexts: [
        context.createOutputContext({
          name: 'booking',
          lifespanCount: 999,
          parameters: {
            agent,
            paginationStartIndex: 0,
          },
        }),
      ],
    };
  }

  @DialogFlowIntent('0.5-booking-choose-time')
  async chosenTime(
    context: FulfillmentContext,
  ): Promise<DialogFlowFulfillmentResponse> {
    const bookingContext = context.getContextByName('booking');
    const paginationStartIndex =
      bookingContext.parameters.paginationStartIndex || 0;

    if (
      !bookingContext.parameters.day &&
      context.dialogFlowResponse.queryResult.parameters['date-time']
    ) {
      bookingContext.parameters.day =
        context.dialogFlowResponse.queryResult.parameters['date-time'];
    }

    const events = await this.outlookCalendarApiService.fetchEvents(
      this.OUTLOOK_USER_ID,
      this.AGENT_TIME_ZONE,
    );
    const slots = this.agentCalendarService.getFreeSlots(
      events,
      this.AGENT_TIME_ZONE,
      DateTime.fromISO(bookingContext.parameters.day),
    );

    const paginatedSlots = slots.slice(
      paginationStartIndex,
      paginationStartIndex + 5,
    );

    console.log(
      `slots: ${slots.length} | paginationStartIndex: ${paginationStartIndex} | paginatedSlots: ${paginatedSlots.length}`,
    );

    const paginationButtons = () => {
      const result = [];
      if (slots.length >= paginationStartIndex + 1 + 5)
        result.push({ text: 'Show more', value: 'Show more' });
      if (paginationStartIndex !== 0)
        result.push({ text: 'Show previous', value: 'Show previous' });
      return result;
    };
    return {
      fulfillmentMessages: [
        context.createSuggestionFulfillmentMessage('please choose a time', [
          ...paginatedSlots.map((aSlot) => {
            return {
              text: aSlot.start.toFormat('hh:mm a'),
              value: aSlot.start.toFormat('hh:mm a'),
            };
          }),
          ...paginationButtons(),
        ]),
      ],
      outputContexts: [bookingContext],
    };
  }
  @DialogFlowIntent('0.5-booking-choose-time-next')
  async chooseTimeNext(
    context: FulfillmentContext,
  ): Promise<DialogFlowFulfillmentResponse> {
    const bookingContext = context.getContextByName('booking');

    const paginationStartIndex = bookingContext.parameters.paginationStartIndex;

    bookingContext.parameters.paginationStartIndex = paginationStartIndex + 5;

    return {
      followupEventInput: context.createFollowupEventInput(
        '0-5-booking-choose-time',
      ),
      outputContexts: [bookingContext],
    };
  }
  @DialogFlowIntent('0.5-booking-choose-time-prev')
  async chooseTimePrev(
    context: FulfillmentContext,
  ): Promise<DialogFlowFulfillmentResponse> {
    const bookingContext = context.getContextByName('booking');

    const paginationStartIndex = bookingContext.parameters.paginationStartIndex;

    bookingContext.parameters.paginationStartIndex =
      paginationStartIndex > 5 ? paginationStartIndex - 5 : 0;

    console.log(
      `paginationStartIndex: ${paginationStartIndex} | new: ${bookingContext.parameters.paginationStartIndex}`,
    );

    return {
      followupEventInput: context.createFollowupEventInput(
        '0-5-booking-choose-time',
      ),
      outputContexts: [bookingContext],
    };
  }
  @DialogFlowIntent('0.5-booking-enter-email')
  async enterEmail(
    context: FulfillmentContext,
  ): Promise<DialogFlowFulfillmentResponse> {
    const bookingContext = context.getContextByName('booking');

    if (
      !bookingContext.parameters.time &&
      context.dialogFlowResponse.queryResult.parameters['date-time']
    ) {
      bookingContext.parameters.time =
        context.dialogFlowResponse.queryResult.parameters['date-time'];
    }

    return {
      outputContexts: [bookingContext],
    };
  }
  @DialogFlowIntent('0.5-booking-create-event')
  async confirmBooking(
    context: FulfillmentContext,
  ): Promise<DialogFlowFulfillmentResponse> {
    const bookingContext = context.getContextByName('booking');
    bookingContext.lifespanCount = 0;

    const chosenDay = DateTime.fromISO(bookingContext.parameters.day);
    const chosenTime = DateTime.fromISO(bookingContext.parameters.time);

    const bookingDateTime = DateTime.fromObject({
      year: chosenDay.year,
      month: chosenDay.month,
      day: chosenDay.day,
      hour: chosenTime.hour,
      minute: chosenTime.minute,
      second: 0,
      millisecond: 0,
    });

    const bookingResult = await this.outlookCalendarApiService.bookEvent(
      this.OUTLOOK_USER_ID,
      bookingContext.parameters.email,
      bookingDateTime,
      bookingDateTime.plus({ minute: 30 }),
    );

    const replyMessage = bookingResult
      ? `Thank you! You’re all booked in for ${bookingDateTime.toLocaleString(
          DateTime.DATETIME_FULL,
        )}`
      : 'Something was wrong, please try one more time late';

    return {
      fulfillmentMessages: [
        context.createSuggestionFulfillmentMessage(replyMessage, [
          {
            text: 'Explore our products',
            value: 'Explore our products',
          },
          { text: 'Get a quote', value: 'Get a quote' },
          // { text: 'File a claim', value: 'File a claim' },
          { text: 'FAQs', value: 'FAQs' },
          { text: 'Book an appointment', value: 'Book an appointment' },
        ]),
      ],
      outputContexts: [bookingContext],
    };
  }
}
