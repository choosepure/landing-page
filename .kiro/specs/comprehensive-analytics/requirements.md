# Requirements Document

## Introduction

This document defines the requirements for the Comprehensive Analytics Integration feature in the ChoosePure mobile app. The feature introduces a unified analytics layer that dispatches events to three providers simultaneously: Firebase Analytics, Mixpanel, and Meta (via server-side Conversions API). These requirements are derived from the approved design document and ensure consistent event tracking, fault isolation, and provider extensibility across the application.

## Glossary

- **Unified_Analytics_Service**: The central module (`src/services/analytics/index.js`) that provides the public API for all analytics operations and dispatches to provider adapters
- **Provider_Adapter**: A module conforming to the adapter interface (init, trackEvent, trackScreen, identify, reset) that communicates with a specific analytics provider
- **Firebase_Adapter**: The provider adapter wrapping `@react-native-firebase/analytics` for Firebase Analytics
- **Mixpanel_Adapter**: The provider adapter wrapping `mixpanel-react-native` for Mixpanel tracking
- **Meta_Adapter**: The provider adapter that queues events and flushes them to the backend endpoint for Meta Conversions API forwarding
- **Event_Queue**: The in-memory array in the Meta adapter that accumulates events before batch transmission
- **Batch_Flush**: The process of sending accumulated Meta events to the backend in a single HTTP POST
- **Backend_Endpoint**: The server route (`POST /api/analytics/events`) that receives batched events and forwards them to Meta Conversions API
- **Adapter_Registry**: The internal list of successfully initialized adapters maintained by the Unified Analytics Service
- **Event_Catalog**: The defined set of 20 analytics events tracked across the app (auth, onboarding, reports, subscription, voting, scanning, referral, CTA, profile, screen views)

## Requirements

### Requirement 1: Unified Analytics Service Initialization

**User Story:** As a developer, I want a single initialization call that sets up all analytics providers, so that I do not need to manage each provider lifecycle independently.

#### Acceptance Criteria

1. WHEN the app mounts, THE Unified_Analytics_Service SHALL initialize all registered provider adapters by calling each adapter's init method with the provided AnalyticsConfig
2. WHEN a provider adapter init method resolves successfully, THE Unified_Analytics_Service SHALL add that adapter to the Adapter_Registry
3. IF a provider adapter init method rejects, THEN THE Unified_Analytics_Service SHALL exclude that adapter from the Adapter_Registry and continue initializing remaining adapters
4. WHEN initialization completes in development mode, THE Unified_Analytics_Service SHALL log the list of successfully initialized adapter names to the console

### Requirement 2: Event Tracking Dispatch

**User Story:** As a product analyst, I want every tracked event sent to all configured providers simultaneously, so that I have consistent data across platforms.

#### Acceptance Criteria

1. WHEN trackEvent is called with a valid event name and properties, THE Unified_Analytics_Service SHALL invoke trackEvent on each adapter in the Adapter_Registry in parallel using Promise.allSettled
2. WHEN trackEvent is called, THE Unified_Analytics_Service SHALL enrich the properties with timestamp, platform, and app_version before dispatching to adapters
3. IF an adapter trackEvent call rejects, THEN THE Unified_Analytics_Service SHALL catch the error and continue dispatching to other adapters without propagating the exception to the caller
4. WHEN trackEvent is called with an empty string or null event name, THE Unified_Analytics_Service SHALL log a warning and discard the event without dispatching to adapters
5. WHEN trackEvent is called before initAnalytics has completed, THE Unified_Analytics_Service SHALL perform no operation and produce no error

### Requirement 3: Event Name Validation

**User Story:** As a developer, I want event names validated against provider constraints, so that invalid events are caught early and never corrupt provider data.

#### Acceptance Criteria

1. THE Unified_Analytics_Service SHALL only dispatch events whose names match the pattern `/^[a-z][a-z0-9_]{0,39}$/`
2. WHEN an event name does not match the valid pattern, THE Unified_Analytics_Service SHALL log a warning in development mode and discard the event

### Requirement 4: Screen View Tracking

**User Story:** As a product analyst, I want screen views automatically tracked when the user navigates between screens, so that I can analyze user flow without manual instrumentation on every screen.

#### Acceptance Criteria

1. WHEN the navigation state changes to a new route, THE Unified_Analytics_Service SHALL call trackScreen with the current route name and the previous route name as a property
2. WHEN the navigation state changes to the same route as the previous state, THE Unified_Analytics_Service SHALL not emit a duplicate screen_view event
3. WHEN trackScreen is called, THE Unified_Analytics_Service SHALL dispatch to all adapters in the Adapter_Registry with the screen name and properties

### Requirement 5: User Identification

**User Story:** As a product analyst, I want user identity synchronized across all providers upon login, so that I can correlate user behavior across Firebase, Mixpanel, and Meta.

#### Acceptance Criteria

1. WHEN identify is called with a userId and traits, THE Unified_Analytics_Service SHALL invoke identify on each adapter in the Adapter_Registry with the same userId and traits
2. WHEN identify is called on the Firebase_Adapter, THE Firebase_Adapter SHALL call setUserId with the userId and setUserProperties with the traits
3. WHEN identify is called on the Mixpanel_Adapter, THE Mixpanel_Adapter SHALL call mixpanel.identify with the userId and mixpanel.getPeople().set with the traits
4. WHEN identify is called on the Meta_Adapter, THE Meta_Adapter SHALL store the userId and traits for inclusion in all subsequent queued events

### Requirement 6: User Reset on Logout

**User Story:** As a user, I want my analytics identity cleared on logout, so that subsequent anonymous activity is not attributed to my account.

#### Acceptance Criteria

1. WHEN reset is called, THE Unified_Analytics_Service SHALL invoke reset on each adapter in the Adapter_Registry
2. WHEN reset is called on the Firebase_Adapter, THE Firebase_Adapter SHALL set userId to null and reset analytics data
3. WHEN reset is called on the Mixpanel_Adapter, THE Mixpanel_Adapter SHALL call mixpanel.reset to generate a new anonymous distinct_id
4. WHEN reset is called on the Meta_Adapter, THE Meta_Adapter SHALL clear stored user data and flush any remaining queued events

### Requirement 7: Firebase Adapter

**User Story:** As a developer, I want a Firebase adapter that wraps the existing Firebase Analytics SDK, so that the unified layer integrates with the already-configured Firebase instance.

#### Acceptance Criteria

1. WHEN the Firebase_Adapter init method is called, THE Firebase_Adapter SHALL resolve immediately since Firebase is auto-initialized via native configuration
2. WHEN the Firebase_Adapter trackEvent method is called, THE Firebase_Adapter SHALL call analytics().logEvent with the event name and properties
3. WHEN the Firebase_Adapter trackScreen method is called, THE Firebase_Adapter SHALL call analytics().logScreenView with screen_name and screen_class parameters
4. IF the Firebase Analytics SDK is not initialized, THEN THE Firebase_Adapter SHALL perform no operation and resolve without error

### Requirement 8: Mixpanel Adapter

**User Story:** As a product analyst, I want Mixpanel integrated for advanced funnel and retention analysis, so that I can leverage Mixpanel-specific features beyond what Firebase provides.

#### Acceptance Criteria

1. WHEN the Mixpanel_Adapter init method is called with a valid mixpanelToken, THE Mixpanel_Adapter SHALL create a Mixpanel instance and call init on it
2. WHEN the Mixpanel_Adapter trackEvent method is called, THE Mixpanel_Adapter SHALL call mixpanel.track with the event name and properties
3. WHEN the Mixpanel_Adapter trackScreen method is called, THE Mixpanel_Adapter SHALL call mixpanel.track with event name "screen_view" and include the screen_name in properties
4. IF the Mixpanel SDK throws during any tracking call, THEN THE Mixpanel_Adapter SHALL catch the error and reject the promise without crashing the app

### Requirement 9: Meta Adapter with Batching

**User Story:** As a growth marketer, I want Meta Conversions API events sent server-side in batches, so that I can optimize ad targeting without adding the native Facebook SDK to the app.

#### Acceptance Criteria

1. WHEN the Meta_Adapter init method is called, THE Meta_Adapter SHALL store the pixelId and start a flush timer with the configured metaFlushInterval
2. WHEN the Meta_Adapter trackEvent method is called, THE Meta_Adapter SHALL add the event to the Event_Queue with eventName, properties, timestamp, userId, and userData
3. WHEN the Event_Queue length reaches the configured metaBatchSize, THE Meta_Adapter SHALL trigger an immediate Batch_Flush
4. WHEN the flush timer fires, THE Meta_Adapter SHALL perform a Batch_Flush of all queued events regardless of queue size
5. WHEN Batch_Flush executes with a non-empty queue, THE Meta_Adapter SHALL POST the batch payload to the Backend_Endpoint with pixelId, events, platform, and appVersion
6. IF the Backend_Endpoint returns a network error or 5xx status, THEN THE Meta_Adapter SHALL re-queue the failed events with a retry flag for one additional attempt
7. IF re-queued events fail a second time, THEN THE Meta_Adapter SHALL discard the events to prevent unbounded queue growth
8. THE Meta_Adapter Event_Queue SHALL never exceed 2 times the configured metaBatchSize in length

### Requirement 10: Backend Analytics Endpoint

**User Story:** As a backend developer, I want a dedicated endpoint for receiving batched analytics events from the mobile app, so that the server can forward them to Meta Conversions API securely.

#### Acceptance Criteria

1. THE Backend_Endpoint SHALL accept POST requests at the path `/api/analytics/events` with an authenticated request containing the AnalyticsBatchPayload
2. WHEN the Backend_Endpoint receives a valid payload, THE Backend_Endpoint SHALL forward each event to Meta Conversions API with proper parameter mapping and SHA-256 hashing of PII fields
3. IF the request body is missing required fields (pixelId or events array), THEN THE Backend_Endpoint SHALL return a 400 status with descriptive error message
4. IF the Meta Conversions API returns an error, THEN THE Backend_Endpoint SHALL log the error and return a 502 status to the client

### Requirement 11: Fault Isolation

**User Story:** As a developer, I want analytics failures completely isolated from app functionality, so that a broken analytics provider never causes a user-facing crash or degraded experience.

#### Acceptance Criteria

1. THE Unified_Analytics_Service SHALL use Promise.allSettled for all adapter dispatch calls to ensure no single adapter rejection affects other adapters
2. IF any adapter method throws an unhandled exception, THEN THE Unified_Analytics_Service SHALL catch the exception and log it in development mode without propagating it
3. WHEN an adapter fails to initialize, THE Unified_Analytics_Service SHALL continue operating with the remaining initialized adapters in the Adapter_Registry

### Requirement 12: Event Catalog Coverage

**User Story:** As a product analyst, I want all 20 defined events consistently tracked across the app, so that I have complete visibility into user behavior at every touchpoint.

#### Acceptance Criteria

1. THE Unified_Analytics_Service SHALL support tracking the following event categories: auth (sign_up, login, logout), onboarding (onboarding_started, onboarding_completed, onboarding_skipped), reports (report_viewed, report_pdf_downloaded), subscription (subscribe_tapped, subscription_started, subscription_cancelled), voting (vote_cast, vote_payment_completed), scanning (product_scanned, manual_barcode_entered), referral (referral_shared, referral_code_copied), CTA (cta_tapped), profile (profile_edited, rate_app_tapped), and screen views (screen_view)
2. WHEN an event from the Event_Catalog is tracked, THE Unified_Analytics_Service SHALL include all required properties as defined in the catalog for that event category

### Requirement 13: Debug Logging

**User Story:** As a developer, I want verbose analytics logging during development, so that I can verify events are dispatched correctly without checking each provider dashboard.

#### Acceptance Criteria

1. WHILE the app is running in development mode, THE Unified_Analytics_Service SHALL log each dispatched event name and properties to the console
2. WHILE the app is running in development mode, THE Unified_Analytics_Service SHALL log adapter failures with the adapter name and error reason
3. WHILE the app is running in production mode, THE Unified_Analytics_Service SHALL suppress all analytics debug logging

### Requirement 14: App Background Flush

**User Story:** As a product analyst, I want queued Meta events sent before the app is suspended, so that analytics data is not lost when users background the app.

#### Acceptance Criteria

1. WHEN the app transitions to background state, THE Meta_Adapter SHALL trigger an immediate Batch_Flush of all queued events
2. IF the Batch_Flush fails during background transition, THEN THE Meta_Adapter SHALL discard the events since the process may be terminated before a retry is possible
