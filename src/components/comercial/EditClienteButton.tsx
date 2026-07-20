"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, TextInput, Textarea } from "@/components/ui/fields";
import { FormFooter, useFormSubmit } from "@/components/forms/FormShell";
import { Button } from "@/components/ui/Button";
import { atualizarCliente } from "@/lib/actions";
import type { Cliente } from "@/lib/types";

export function EditClienteButton({ cliente }: { cliente: Cliente }) {
  const [open, setOpen] = useState(false);
  const { pending, error, run } = useFormSubmit(() => setOpen(false));
  const [nome, setNome] = useState(cliente.nome);
  const [telefone, setTelefone] = useState(cliente.telefone ?? "");
  const [email, setEmail] = useState(cliente.email ?? "");
  const [doc, setDoc] = useState(cliente.cpf_cnpj ?? "");
  const [empresaClinica, setEmpresaClinica] = useState(cliente.empresa_clinica_nome ?? "");
  const [instagram, setInstagram] = useState(cliente.instagram ?? "");
  const [drive, setDrive] = useState(cliente.drive_link ?? "");
  const [obs, setObs] = useState(cliente.observacao ?? "");

  return (
    <>
      <Button onClick={() => setOpen(true)}>Editar</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Editar cliente">
        <div className="space-y-5">
          <div className="space-y-4">
            <Field label="Nome *"><TextInput value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
            <Field label="Telefone"><TextInput value={telefone} onChange={(e) => setTelefone(e.target.value)} /></Field>
            <Field label="E-mail"><TextInput value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="CPF / CNPJ"><TextInput value={doc} onChange={(e) => setDoc(e.target.value)} /></Field>
            <Field label="Empresa / Clínica"><TextInput value={empresaClinica} onChange={(e) => setEmpresaClinica(e.target.value)} /></Field>
            <Field label="Instagram"><TextInput value={instagram} onChange={(e) => setInstagram(e.target.value)} /></Field>
            <Field label="Link Google Drive"><TextInput value={drive} onChange={(e) => setDrive(e.target.value)} /></Field>
            <Field label="Observações"><Textarea value={obs} onChange={(e) => setObs(e.target.value)} /></Field>
          </div>
          <FormFooter
            pending={pending}
            error={error}
            submitLabel="Salvar alterações"
            onSubmit={() =>
              run(() =>
                atualizarCliente(cliente.id, {
                  nome, telefone: telefone || null, email: email || null, cpf_cnpj: doc || null,
                  empresa_clinica_nome: empresaClinica || null, instagram: instagram || null,
                  drive_link: drive || null, observacao: obs || null,
                }),
              )
            }
          />
        </div>
      </Drawer>
    </>
  );
}
