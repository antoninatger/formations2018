' Ouvre les cours sans aucune fenetre noire (18 octobre).
' Lance par le raccourci « Cours » du bureau. Un .bat ouvrait une console, et sous
' Windows 11 la console s'ouvre dans le Terminal deja present : c'est la fenetre du
' Sequenceur (serveur du port 5151) qui passait alors au premier plan. wscript n'a pas
' de console : seul Edge apparait. Le travail est fait par lancer.js, comme avant.
Option Explicit
Dim sh, fso, ici, cours
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
ici = fso.GetParentFolderName(WScript.ScriptFullName)
cours = fso.GetParentFolderName(ici)
sh.CurrentDirectory = cours
If sh.Run("cmd /c where node", 0, True) <> 0 Then
  MsgBox "Node.js est introuvable sur cet ordinateur. Les cours s'ouvrent quand meme en double-cliquant index.html.", 48, "Cours"
  sh.Run """" & cours & "\index.html"""
  WScript.Quit
End If
sh.Run "node """ & ici & "\lancer.js""", 0, False
