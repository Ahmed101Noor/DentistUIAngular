export interface MedicalQuestionDto {
  id: number;
  patientId: number;
  questionText: string;
  isAnswered: boolean;
  answerText?: string;
  answeredAt?: Date;
}

export interface CreateMedicalQuestionDto {
  patientId: number;
  questionText: string;
  answerText?: string;
  answeredAt?: Date;
}

export interface UpdateMedicalQuestionDto {
  id: number;
  questionText: string;
  answerText?: string;
  isAnswered: boolean;
  answeredAt?: Date;
}