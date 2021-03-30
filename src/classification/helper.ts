import { Exam } from "../interfaces";

/**
 * removes all *'s found in the exam values
 */
export const removeStars = (exam: Exam): Exam => {
  return JSON.parse(JSON.stringify(exam).replace(/\*/g, ''));
}
