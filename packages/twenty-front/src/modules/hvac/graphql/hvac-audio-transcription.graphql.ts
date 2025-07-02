import { gql } from '@apollo/client';

// Fragments
export const HVAC_AUDIO_METADATA_FRAGMENT = gql`
  fragment HvacAudioMetadataFragment on HvacAudioMetadata {
    customerId
    emailId
    technicianId
    timestamp
    fileSize
    audioFormat
    sampleRate
    channels
  }
`;

export const HVAC_AI_INSIGHTS_FRAGMENT = gql`
  fragment HvacAIInsightsFragment on HvacAIInsights {
    sentiment
    urgency
    keywords
    summary
    actionItems
    customerIssues
  }
`;

export const HVAC_AUDIO_TRANSCRIPTION_FRAGMENT = gql`
  fragment HvacAudioTranscriptionFragment on HvacAudioTranscription {
    id
    originalFileName
    transcriptionText
    confidence
    language
    duration
    processingTime
    status
    metadata {
      ...HvacAudioMetadataFragment
    }
    aiInsights {
      ...HvacAIInsightsFragment
    }
  }
  ${HVAC_AUDIO_METADATA_FRAGMENT}
  ${HVAC_AI_INSIGHTS_FRAGMENT}
`;

// Mutations
export const PROCESS_HVAC_AUDIO_TRANSCRIPTION = gql`
  mutation ProcessHvacAudioTranscription($input: HvacAudioTranscriptionInput!) {
    processHvacAudioTranscription(input: $input) {
      ...HvacAudioTranscriptionFragment
    }
  }
  ${HVAC_AUDIO_TRANSCRIPTION_FRAGMENT}
`;

// Queries
export const GET_HVAC_AUDIO_TRANSCRIPTION = gql`
  query GetHvacAudioTranscription($id: ID!) {
    hvacAudioTranscription(id: $id) {
      ...HvacAudioTranscriptionFragment
    }
  }
  ${HVAC_AUDIO_TRANSCRIPTION_FRAGMENT}
`;

export const SEARCH_HVAC_AUDIO_TRANSCRIPTIONS = gql`
  query SearchHvacAudioTranscriptions($input: HvacTranscriptionSearchInput!) {
    searchHvacAudioTranscriptions(input: $input) {
      transcriptions {
        ...HvacAudioTranscriptionFragment
      }
      totalCount
      hasMore
    }
  }
  ${HVAC_AUDIO_TRANSCRIPTION_FRAGMENT}
`;

export const GET_HVAC_AUDIO_TRANSCRIPTION_STATS = gql`
  query GetHvacAudioTranscriptionStats {
    hvacAudioTranscriptionStats
  }
`;

// Additional queries for integration
export const GET_CUSTOMER_AUDIO_TRANSCRIPTIONS = gql`
  query GetCustomerAudioTranscriptions($customerId: ID!, $limit: Int, $offset: Int) {
    searchHvacAudioTranscriptions(input: {
      customerId: $customerId
      limit: $limit
      offset: $offset
    }) {
      transcriptions {
        ...HvacAudioTranscriptionFragment
      }
      totalCount
      hasMore
    }
  }
  ${HVAC_AUDIO_TRANSCRIPTION_FRAGMENT}
`;

export const GET_TECHNICIAN_AUDIO_TRANSCRIPTIONS = gql`
  query GetTechnicianAudioTranscriptions($technicianId: ID!, $limit: Int, $offset: Int) {
    searchHvacAudioTranscriptions(input: {
      technicianId: $technicianId
      limit: $limit
      offset: $offset
    }) {
      transcriptions {
        ...HvacAudioTranscriptionFragment
      }
      totalCount
      hasMore
    }
  }
  ${HVAC_AUDIO_TRANSCRIPTION_FRAGMENT}
`;

export const SEARCH_TRANSCRIPTIONS_BY_TEXT = gql`
  query SearchTranscriptionsByText($searchText: String!, $limit: Int, $offset: Int) {
    searchHvacAudioTranscriptions(input: {
      searchText: $searchText
      limit: $limit
      offset: $offset
    }) {
      transcriptions {
        ...HvacAudioTranscriptionFragment
      }
      totalCount
      hasMore
    }
  }
  ${HVAC_AUDIO_TRANSCRIPTION_FRAGMENT}
`;

export const GET_RECENT_AUDIO_TRANSCRIPTIONS = gql`
  query GetRecentAudioTranscriptions($limit: Int = 10) {
    searchHvacAudioTranscriptions(input: {
      limit: $limit
      offset: 0
    }) {
      transcriptions {
        ...HvacAudioTranscriptionFragment
      }
      totalCount
      hasMore
    }
  }
  ${HVAC_AUDIO_TRANSCRIPTION_FRAGMENT}
`;

// Subscription for real-time updates
export const AUDIO_TRANSCRIPTION_UPDATES = gql`
  subscription AudioTranscriptionUpdates($customerId: ID) {
    audioTranscriptionUpdated(customerId: $customerId) {
      ...HvacAudioTranscriptionFragment
    }
  }
  ${HVAC_AUDIO_TRANSCRIPTION_FRAGMENT}
`;

// Analytics queries
export const GET_AUDIO_TRANSCRIPTION_ANALYTICS = gql`
  query GetAudioTranscriptionAnalytics($dateFrom: String, $dateTo: String, $customerId: ID) {
    audioTranscriptionAnalytics(dateFrom: $dateFrom, dateTo: $dateTo, customerId: $customerId) {
      totalTranscriptions
      transcriptionsToday
      transcriptionsThisWeek
      transcriptionsThisMonth
      averageConfidence
      averageProcessingTime
      topKeywords {
        keyword
        count
      }
      sentimentDistribution {
        positive
        neutral
        negative
      }
      urgencyDistribution {
        low
        medium
        high
        critical
      }
      languageDistribution {
        language
        count
      }
      formatDistribution {
        format
        count
      }
    }
  }
`;

// Error handling queries
export const GET_TRANSCRIPTION_ERRORS = gql`
  query GetTranscriptionErrors($limit: Int = 50, $offset: Int = 0) {
    transcriptionErrors(limit: $limit, offset: $offset) {
      code
      message
      details
      transcriptionId
      timestamp
    }
  }
`;

// Configuration queries
export const GET_AUDIO_TRANSCRIPTION_CONFIG = gql`
  query GetAudioTranscriptionConfig {
    audioTranscriptionConfig {
      maxFileSize
      supportedFormats
      maxDuration
      sampleRate
      channels
      language
      confidenceThreshold
      enableAIInsights
      enableKeywordExtraction
      enableSentimentAnalysis
      enableUrgencyDetection
    }
  }
`;
