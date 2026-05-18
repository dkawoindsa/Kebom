'use client';

import { useState, useRef } from 'react';
import EditableField from '@/components/ui/EditableField';
import SkillBadge from '@/components/ui/SkillBadge';
import WarningIcon from '@/components/ui/WarningIcon';
import type { ResumeData, JobRequirements, ExperienceItem, EducationItem } from '@/types/resume';
import type { LoadingPhase, WizardError } from '@/types/wizard';

interface StepReadProps {
  resumeData: ResumeData;
  jobRequirements: JobRequirements;
  onConfirm: (updatedResumeData: ResumeData) => void;
  loading: LoadingPhase;
  error: WizardError | null;
}

export default function StepRead({ resumeData, jobRequirements, onConfirm, loading, error }: StepReadProps) {
  const [draft, setDraft] = useState<ResumeData>({ ...resumeData });
  const [addingSkill, setAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const newSkillInputRef = useRef<HTMLInputElement>(null);

  const isAnalyzing = loading === 'analyzing';
  const canConfirm = draft.name.trim().length > 0 && draft.contactEmail.trim().length > 0;

  function updateDraft(field: keyof ResumeData, value: ResumeData[keyof ResumeData]) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function handleAddSkill() {
    const trimmed = newSkill.trim();
    if (trimmed) {
      setDraft((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    }
    setNewSkill('');
    setAddingSkill(false);
  }

  function handleDeleteSkill(index: number) {
    setDraft((prev) => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
  }

  function handleAddExperience() {
    const item: ExperienceItem = { company: '', role: '', period: '', description: '' };
    setDraft((prev) => ({ ...prev, experience: [...prev.experience, item] }));
  }

  function handleDeleteExperience(index: number) {
    setDraft((prev) => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));
  }

  function handleUpdateExperience(index: number, field: keyof ExperienceItem, value: string) {
    setDraft((prev) => {
      const updated = prev.experience.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return { ...prev, experience: updated };
    });
  }

  function handleAddProject() {
    const item: ExperienceItem = { company: '', role: '', period: '', description: '' };
    setDraft((prev) => ({ ...prev, projects: [...(prev.projects ?? []), item] }));
  }

  function handleDeleteProject(index: number) {
    setDraft((prev) => ({ ...prev, projects: (prev.projects ?? []).filter((_, i) => i !== index) }));
  }

  function handleUpdateProject(index: number, field: keyof ExperienceItem, value: string) {
    setDraft((prev) => {
      const updated = (prev.projects ?? []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return { ...prev, projects: updated };
    });
  }

  function handleAddEducation() {
    const item: EducationItem = { institution: '', degree: '', period: '' };
    setDraft((prev) => ({ ...prev, education: [...prev.education, item] }));
  }

  function handleDeleteEducation(index: number) {
    setDraft((prev) => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  }

  function handleUpdateEducation(index: number, field: keyof EducationItem, value: string) {
    setDraft((prev) => {
      const updated = prev.education.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return { ...prev, education: updated };
    });
  }

  return (
    <div className="space-y-4">
      {jobRequirements.requiredSkills.length === 0 && (
        <div className="rounded bg-amber-500/10 border border-amber-500/20 px-3 py-2">
          <p className="text-xs text-amber-400">
            채용공고에서 요구 스킬을 찾을 수 없습니다. 공고 내용을 확인해주세요.
          </p>
        </div>
      )}

      {draft.skills.length === 0 && draft.experience.length === 0 && (draft.projects ?? []).length === 0 && (
        <div className="rounded bg-amber-500/10 border border-amber-500/20 px-3 py-2">
          <p className="text-xs text-amber-400">
            이력서에서 경력·프로젝트 또는 스킬 정보를 찾을 수 없습니다. 직접 추가해주세요.
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg bg-red-950/50 border border-red-800/60 px-4 py-3 text-sm text-red-300 flex items-center gap-2"
        >
          <WarningIcon />
          {error.message}
        </div>
      )}

      {/* 기본 정보 */}
      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-4">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">기본 정보</p>

        <div className="space-y-1">
          <p className="text-xs text-neutral-500">이름 <span className="text-red-400" aria-label="필수">*</span></p>
          <EditableField
            id="field-name"
            value={draft.name}
            onChange={(v) => updateDraft('name', v)}
            label="이름"
            placeholder="이름을 입력하세요"
            aria-describedby={draft.name.trim().length === 0 ? 'error-name' : undefined}
          />
          {draft.name.trim().length === 0 && (
            <p id="error-name" className="text-xs text-red-400 mt-1" role="alert">이름은 필수 항목입니다.</p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-neutral-500">이메일 <span className="text-red-400" aria-label="필수">*</span></p>
          <EditableField
            id="field-email"
            value={draft.contactEmail}
            onChange={(v) => updateDraft('contactEmail', v)}
            label="이메일"
            placeholder="이메일을 입력하세요"
            aria-describedby={draft.contactEmail.trim().length === 0 ? 'error-email' : undefined}
          />
          {draft.contactEmail.trim().length === 0 && (
            <p id="error-email" className="text-xs text-red-400 mt-1" role="alert">이메일은 필수 항목입니다.</p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-neutral-500">전화번호</p>
          <EditableField
            value={draft.contactPhone ?? ''}
            onChange={(v) => updateDraft('contactPhone', v)}
            label="전화번호"
            placeholder="전화번호를 입력하세요"
          />
        </div>
      </div>

      {/* 요약 */}
      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-3">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">요약</p>
        <EditableField
          value={draft.summary}
          onChange={(v) => updateDraft('summary', v)}
          label="요약"
          multiline
          placeholder="자기소개 또는 요약을 입력하세요"
        />
      </div>

      {/* 스킬 */}
      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-3">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">스킬</p>
        <div className="flex flex-wrap gap-2">
          {draft.skills.map((skill, i) => (
            <SkillBadge
              key={i}
              skill={skill}
              status="match"
              onDelete={() => handleDeleteSkill(i)}
            />
          ))}
        </div>

        {addingSkill ? (
          <input
            ref={newSkillInputRef}
            autoFocus
            type="text"
            aria-label="새 스킬 입력"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); }
              if (e.key === 'Escape') { e.preventDefault(); setNewSkill(''); setAddingSkill(false); }
            }}
            onBlur={handleAddSkill}
            placeholder="스킬 입력 후 Enter"
            className="rounded-lg bg-[#0a0a0a] border border-neutral-600 px-3 py-1.5 text-sm text-neutral-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingSkill(true)}
            className="text-neutral-400 text-sm hover:text-neutral-200 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 rounded"
          >
            + 스킬 추가
          </button>
        )}
      </div>

      {/* 경력 */}
      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-3">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">경력</p>

        <div className="space-y-3">
          {draft.experience.map((exp, i) => (
            <div key={i} className="rounded bg-[#1a1a1a] border border-neutral-800/60 p-4 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500">회사</p>
                  <button
                    type="button"
                    onClick={() => handleDeleteExperience(i)}
                    aria-label={`경력 ${i + 1} 삭제`}
                    className="text-neutral-400 text-sm hover:text-red-400 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 rounded"
                  >
                    삭제
                  </button>
                </div>
                <EditableField
                  value={exp.company}
                  onChange={(v) => handleUpdateExperience(i, 'company', v)}
                  label={`경력 ${i + 1} 회사`}
                  placeholder="회사명"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">직무</p>
                <EditableField
                  value={exp.role}
                  onChange={(v) => handleUpdateExperience(i, 'role', v)}
                  label={`경력 ${i + 1} 직무`}
                  placeholder="직무/포지션"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">기간</p>
                <EditableField
                  value={exp.period}
                  onChange={(v) => handleUpdateExperience(i, 'period', v)}
                  label={`경력 ${i + 1} 기간`}
                  placeholder="예: 2022.01 - 2024.06"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">설명</p>
                <EditableField
                  value={exp.description}
                  onChange={(v) => handleUpdateExperience(i, 'description', v)}
                  label={`경력 ${i + 1} 설명`}
                  multiline
                  placeholder="주요 업무 및 성과"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddExperience}
          className="text-neutral-400 text-sm hover:text-neutral-200 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 rounded"
        >
          경력 추가
        </button>
      </div>

      {/* 프로젝트 */}
      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-3">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">프로젝트</p>

        <div className="space-y-3">
          {(draft.projects ?? []).map((proj, i) => (
            <div key={i} className="rounded bg-[#1a1a1a] border border-neutral-800/60 p-4 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500">프로젝트명</p>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(i)}
                    aria-label={`프로젝트 ${i + 1} 삭제`}
                    className="text-neutral-400 text-sm hover:text-red-400 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 rounded"
                  >
                    삭제
                  </button>
                </div>
                <EditableField
                  value={proj.company}
                  onChange={(v) => handleUpdateProject(i, 'company', v)}
                  label={`프로젝트 ${i + 1} 이름`}
                  placeholder="프로젝트명"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">역할</p>
                <EditableField
                  value={proj.role}
                  onChange={(v) => handleUpdateProject(i, 'role', v)}
                  label={`프로젝트 ${i + 1} 역할`}
                  placeholder="담당 역할/포지션"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">기간</p>
                <EditableField
                  value={proj.period}
                  onChange={(v) => handleUpdateProject(i, 'period', v)}
                  label={`프로젝트 ${i + 1} 기간`}
                  placeholder="예: 2023.06 - 2023.12"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">설명</p>
                <EditableField
                  value={proj.description}
                  onChange={(v) => handleUpdateProject(i, 'description', v)}
                  label={`프로젝트 ${i + 1} 설명`}
                  multiline
                  placeholder="주요 구현 기능 및 성과"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddProject}
          className="text-neutral-400 text-sm hover:text-neutral-200 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 rounded"
        >
          프로젝트 추가
        </button>
      </div>

      {/* 학력 */}
      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-3">
        <p className="text-sm font-medium text-neutral-400 uppercase tracking-wider">학력</p>

        <div className="space-y-3">
          {draft.education.map((edu, i) => (
            <div key={i} className="rounded bg-[#1a1a1a] border border-neutral-800/60 p-4 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500">학교</p>
                  <button
                    type="button"
                    onClick={() => handleDeleteEducation(i)}
                    aria-label={`학력 ${i + 1} 삭제`}
                    className="text-neutral-400 text-sm hover:text-red-400 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 rounded"
                  >
                    삭제
                  </button>
                </div>
                <EditableField
                  value={edu.institution}
                  onChange={(v) => handleUpdateEducation(i, 'institution', v)}
                  label={`학력 ${i + 1} 학교`}
                  placeholder="학교명"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">학위/전공</p>
                <EditableField
                  value={edu.degree}
                  onChange={(v) => handleUpdateEducation(i, 'degree', v)}
                  label={`학력 ${i + 1} 학위`}
                  placeholder="예: 컴퓨터공학 학사"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">기간</p>
                <EditableField
                  value={edu.period}
                  onChange={(v) => handleUpdateEducation(i, 'period', v)}
                  label={`학력 ${i + 1} 기간`}
                  placeholder="예: 2018.03 - 2022.02"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddEducation}
          className="text-neutral-400 text-sm hover:text-neutral-200 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-500 rounded"
        >
          학력 추가
        </button>
      </div>

      <button
        type="button"
        disabled={isAnalyzing || !canConfirm}
        onClick={() => onConfirm(draft)}
        className="w-full rounded-lg bg-white text-black text-sm font-medium px-4 py-2 hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
      >
        {isAnalyzing ? '분석 중...' : '확인 후 분석'}
      </button>
    </div>
  );
}
