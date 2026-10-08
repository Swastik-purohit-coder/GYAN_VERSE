"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/lib/api";

// 1. Noticeboard Hook
export function useNoticeboard(filters = {}) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedFilters = filterKey ? JSON.parse(filterKey) : {};
      const data = await apiClient.getNotices(parsedFilters);
      setNotices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load notices");
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const addNotice = async (noticeData) => {
    const res = await apiClient.createNotice(noticeData);
    await fetchNotices();
    return res;
  };

  const removeNotice = async (id) => {
    const res = await apiClient.deleteNotice(id);
    await fetchNotices();
    return res;
  };

  return { notices, loading, error, refetch: fetchNotices, addNotice, removeNotice };
}

// 2. Student Sub-Groups Hook
export function useStudentGroups(filters = {}) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedFilters = filterKey ? JSON.parse(filterKey) : {};
      const data = await apiClient.getGroups(parsedFilters);
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const addGroup = async (groupData) => {
    const res = await apiClient.createGroup(groupData);
    await fetchGroups();
    return res;
  };

  return { groups, loading, error, refetch: fetchGroups, addGroup };
}

// 3. Group Messages Hook
export function useGroupMessages(groupId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(Boolean(groupId));
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async () => {
    if (!groupId) return;
    try {
      const data = await apiClient.getGroupMessages(groupId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load group messages");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (msgData) => {
    const res = await apiClient.sendGroupMessage(groupId, msgData);
    await fetchMessages();
    return res;
  };

  return { messages, loading, error, refetch: fetchMessages, sendMessage };
}

// 4. Skill Courses Hook
export function useSkillCourses(filters = {}) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedFilters = filterKey ? JSON.parse(filterKey) : {};
      const data = await apiClient.getSkillCourses(parsedFilters);
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load skill courses");
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const addCourse = async (courseData) => {
    const res = await apiClient.createSkillCourse(courseData);
    await fetchCourses();
    return res;
  };

  return { courses, loading, error, refetch: fetchCourses, addCourse };
}

// 5. Monthly Competitions Hook
export function useCompetitions(filters = {}) {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedFilters = filterKey ? JSON.parse(filterKey) : {};
      const data = await apiClient.getCompetitions(parsedFilters);
      setCompetitions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load competitions");
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const addCompetition = async (compData) => {
    const res = await apiClient.createCompetition(compData);
    await fetchCompetitions();
    return res;
  };

  return { competitions, loading, error, refetch: fetchCompetitions, addCompetition };
}

// 6. Administrative Overview & Faculty Hook
export function useAdminOverview() {
  const [overview, setOverview] = useState(null);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovData, facData] = await Promise.all([
        apiClient.getAdminOverview().catch(() => null),
        apiClient.getFacultyList().catch(() => []),
      ]);
      setOverview(ovData);
      setFaculty(Array.isArray(facData) ? facData : []);
    } catch (err) {
      setError(err?.message || "Failed to load administration data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  return { overview, faculty, loading, error, refetch: fetchAdminData };
}
