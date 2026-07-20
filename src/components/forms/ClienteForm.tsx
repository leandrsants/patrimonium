"use client";

import { useState } from "react";
import { Field, TextInput, Textarea } from "@/components/ui/fields";
import { FormFields, FormFooter, useFormSubmit } from "@/components/forms/FormShell";
import { criarCliente } from "@/lib/actions";

export function ClienteForm({ onDone }: { onDone: () => void }) {
  const { pending, error, run } = useFormSubmit(onDone);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [more, setMore] = useState(false);
  const [email, setEmail] = useState("");
  const [doc, setDoc] = useState("");
  const [empresaClinica, setEmpresaClinica] = useState("");
  const [instagram, setInstagram] = useState("");
  const [drive, setDrive] = useState("");
  const [obs, setObs] = useState("");

  return (
    <div className="space-y-5">
      <FormFields>
        <Field label="Nome *">
          <TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do cliente" autoFocus />
        </Field>
        <Field label="Telefone">
          <TextInput value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-0000" />
        </Field>

        <button type="button" onClick={() => setMore((v) => !v)} className="text-xs font-medium text-ink-faint hover:text-ink-soft">
          {more ? "− Menos informações" : "+ Mais informações"}
        </button>

        {more ? (
          <div className="space-y-4 border-t border-line pt-4">
            <Field label="E-mail">
              <TextInput value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </Field>
            <Field label="CPF / CNPJ">
              <TextInput value={doc} onChange={(e) => setDoc(e.target.value)} />
            </Field>
            <Field label="Empresa / Clínica">
              <TextInput value={empresaClinica} onChange={(e) => setEmpresaClinica(e.target.value)} />
            </Field>
            <Field label="Instagram">
              <TextInput value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@perfil" />
            </Field>
            <Field label="Link Google Drive">
              <TextInput value={drive} onChange={(e) => setDrive(e.target.value)} />
            </Field>
            <Field label="Observações">
              <Textarea value={obs} onChange={(e) => setObs(e.target.value)} />
            </Field>
          </div>
        ) : null}
      </FormFields>

      <FormFooter
        pending={pending}
        error={error}
        submitLabel="Criar cliente"
        onSubmit={() =>
          run(() =>
            criarCliente({
              nome,
              telefone,
              email,
              cpf_cnpj: doc,
              empresa_clinica_nome: empresaClinica,
              instagram,
              drive_link: drive,
              observacao: obs,
            }),
          )
        }
      />
    </div>
  );
}
