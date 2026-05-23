/**
 * Formats standard API responses for all successful requests.
 */
export const apiResponse = (res, statusCode, data, message = 'Operation successful') => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    results: Array.isArray(data) ? data.length : undefined,
    data
  });
};

/**
 * Standardized pagination wrapper for large-scale registers.
 */
export const paginatedResponse = (res, statusCode, data, page, limit, total, message = 'Data fetched successfully') => {
  const pages = Math.ceil(total / limit);
  return res.status(statusCode).json({
    status: 'success',
    message,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalPages: pages,
      totalResults: total,
      hasNext: page < pages,
      hasPrev: page > 1
    },
    data
  });
};

export default apiResponse;
