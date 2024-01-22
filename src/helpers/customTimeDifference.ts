export const calculateTimeDifferenceInMinutes = (start, end) => {
  // Разбиваем строки на массивы [часы, минуты]
  const startTime = start.split(':').map(Number)
  const endTime = end.split(':').map(Number)

  // Преобразуем часы и минуты в общее количество минут
  const startMinutes = startTime[0] * 60 + startTime?.[1] || 0
  let endMinutes = endTime[0] * 60 + endTime?.[1] || 0

  // Если конечное время меньше начального, добавляем 24 часа к конечному времени
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }

  // Вычисляем разницу в минутах
  const differenceInMinutes = endMinutes - startMinutes

  return differenceInMinutes
}
